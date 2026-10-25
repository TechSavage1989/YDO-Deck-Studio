package updater

import (
	"context"
	"crypto/sha256"
	"debug/pe"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

type persistentState struct {
	ETag          string       `json:"etag"`
	CachedRelease *ReleaseInfo `json:"cached_release,omitempty"`
	LastCheckedAt time.Time    `json:"last_checked_at"`
	BackoffUntil  time.Time    `json:"backoff_until"`
}

type Client struct {
	AppID            string
	InstalledVersion string
	RepoOwner        string
	RepoName         string
	DataDir          string
	APIBase          string
	HTTP             *http.Client
	AllowedHosts     map[string]bool
	ManualCooldown   time.Duration
	AutoCooldown     time.Duration
	MaxDownloadBytes int64

	mu         sync.Mutex
	inflight   bool
	state      persistentState
	status     Status
	lastManual time.Time
}

type githubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
}
type githubRelease struct {
	TagName    string        `json:"tag_name"`
	HTMLURL    string        `json:"html_url"`
	Body       string        `json:"body"`
	Draft      bool          `json:"draft"`
	Prerelease bool          `json:"prerelease"`
	Assets     []githubAsset `json:"assets"`
}

func NewClient(appID, installed, owner, repo, dataDir string) *Client {
	allowed := map[string]bool{"api.github.com": true, "github.com": true, "objects.githubusercontent.com": true, "release-assets.githubusercontent.com": true}
	c := &Client{AppID: appID, InstalledVersion: installed, RepoOwner: owner, RepoName: repo, DataDir: dataDir, APIBase: "https://api.github.com", AllowedHosts: allowed, ManualCooldown: 30 * time.Second, AutoCooldown: 30 * time.Second, MaxDownloadBytes: 250 << 20}
	c.HTTP = &http.Client{Timeout: 45 * time.Second, CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) > 6 {
			return errors.New("too many redirects")
		}
		if !c.allowedURL(req.URL) {
			return fmt.Errorf("redirect host is not allowed: %s", req.URL.Hostname())
		}
		return nil
	}}
	c.status = Status{State: "unknown", InstalledVersion: installed}
	c.loadState()
	if c.state.CachedRelease != nil {
		c.status.Latest = c.state.CachedRelease
	}
	return c
}

func (c *Client) statePath() string { return filepath.Join(c.DataDir, "state.json") }
func (c *Client) loadState() {
	b, err := os.ReadFile(c.statePath())
	if err == nil {
		_ = json.Unmarshal(b, &c.state)
	}
}
func (c *Client) saveState() {
	_ = os.MkdirAll(c.DataDir, 0o755)
	b, _ := json.MarshalIndent(c.state, "", "  ")
	tmp := c.statePath() + ".tmp"
	if os.WriteFile(tmp, b, 0o600) == nil {
		_ = os.Rename(tmp, c.statePath())
	}
}
func (c *Client) allowedURL(u *url.URL) bool {
	return u != nil && u.Scheme == "https" && c.AllowedHosts[strings.ToLower(u.Hostname())]
}
func (c *Client) Status() Status { c.mu.Lock(); defer c.mu.Unlock(); return c.status }

func (c *Client) Check(ctx context.Context, manual bool) Status {
	c.mu.Lock()
	now := time.Now()
	if c.inflight {
		s := c.status
		c.mu.Unlock()
		return s
	}
	if !c.state.BackoffUntil.IsZero() && now.Before(c.state.BackoffUntil) {
		c.status.State = "throttled"
		c.status.BackoffUntil = c.state.BackoffUntil.Format(time.RFC3339)
		c.status.Message = "Update checks are temporarily throttled by the release service."
		s := c.status
		c.mu.Unlock()
		return s
	}
	if manual && !c.lastManual.IsZero() && now.Sub(c.lastManual) < c.ManualCooldown {
		c.status.Message = "Please wait before checking again."
		s := c.status
		c.mu.Unlock()
		return s
	}
	if !manual && !c.state.LastCheckedAt.IsZero() && now.Sub(c.state.LastCheckedAt) < c.AutoCooldown {
		s := c.status
		c.mu.Unlock()
		return s
	}
	if manual {
		c.lastManual = now
	}
	c.inflight = true
	c.status.State = "checking"
	c.status.Message = "Checking for updates..."
	c.mu.Unlock()

	s := c.checkRemote(ctx)
	c.mu.Lock()
	c.inflight = false
	c.status = s
	c.mu.Unlock()
	return s
}

func (c *Client) checkRemote(ctx context.Context) Status {
	reqURL := fmt.Sprintf("%s/repos/%s/%s/releases?per_page=20", strings.TrimRight(c.APIBase, "/"), c.RepoOwner, c.RepoName)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return c.errorStatus(err)
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "YGO-Deck-Studio-Updater/1")
	c.mu.Lock()
	etag := c.state.ETag
	cached := c.state.CachedRelease
	c.mu.Unlock()
	if etag != "" {
		req.Header.Set("If-None-Match", etag)
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return c.errorStatus(fmt.Errorf("release check failed: %w", err))
	}
	defer resp.Body.Close()
	now := time.Now()
	if resp.StatusCode == http.StatusNotModified && cached != nil {
		c.mu.Lock()
		c.state.LastCheckedAt = now
		c.saveState()
		c.mu.Unlock()
		return c.statusFromRelease(cached, now)
	}
	if resp.StatusCode == http.StatusNotFound {
		c.mu.Lock()
		c.state.LastCheckedAt = now
		c.saveState()
		c.mu.Unlock()
		return Status{State: "no_release", InstalledVersion: c.InstalledVersion, Message: "No published application release is available yet.", LastCheckedAt: now.Format(time.RFC3339)}
	}
	if resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests {
		until := retryUntil(resp, now)
		c.mu.Lock()
		c.state.BackoffUntil = until
		c.state.LastCheckedAt = now
		c.saveState()
		c.mu.Unlock()
		return Status{State: "throttled", InstalledVersion: c.InstalledVersion, Message: "Update checks are temporarily rate limited.", LastCheckedAt: now.Format(time.RFC3339), BackoffUntil: until.Format(time.RFC3339)}
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return c.errorStatus(fmt.Errorf("release service returned %s: %s", resp.Status, strings.TrimSpace(string(body))))
	}
	var releases []githubRelease
	if err := json.NewDecoder(io.LimitReader(resp.Body, 4<<20)).Decode(&releases); err != nil {
		return c.errorStatus(fmt.Errorf("invalid release response: %w", err))
	}
	var rel githubRelease
	found := false
	for _, candidate := range releases {
		if candidate.Draft {
			continue
		}
		if _, err := parseVersion(candidate.TagName); err != nil {
			continue
		}
		rel = candidate
		found = true
		break
	}
	if !found {
		return Status{State: "no_release", InstalledVersion: c.InstalledVersion, Message: "No published application release is available yet.", LastCheckedAt: now.Format(time.RFC3339)}
	}
	manifestAsset := findAsset(rel.Assets, "update-manifest.json")
	if manifestAsset == nil {
		return c.errorStatus(errors.New("latest release is missing update-manifest.json"))
	}
	manifest, err := c.fetchManifest(ctx, manifestAsset.BrowserDownloadURL)
	if err != nil {
		return c.errorStatus(err)
	}
	if manifest.AppID != c.AppID {
		return c.errorStatus(fmt.Errorf("release app identity mismatch: %s", manifest.AppID))
	}
	if manifest.Tag != "" && manifest.Tag != rel.TagName {
		return c.errorStatus(errors.New("release manifest tag mismatch"))
	}
	asset := findAsset(rel.Assets, manifest.AssetName)
	if asset == nil {
		return c.errorStatus(fmt.Errorf("release asset %s is missing", manifest.AssetName))
	}
	if manifest.Size > 0 && asset.Size > 0 && manifest.Size != asset.Size {
		return c.errorStatus(errors.New("release asset size mismatch"))
	}
	info := &ReleaseInfo{Version: manifest.Version, Tag: rel.TagName, PageURL: rel.HTMLURL, AssetName: manifest.AssetName, AssetURL: asset.BrowserDownloadURL, SHA256: strings.ToLower(manifest.SHA256), Size: manifest.Size, Notes: trimNotes(manifest.Notes), ReadMore: hasAdditionalReleaseContent(rel.Body, manifest.Notes), ReleaseBody: rel.Body}
	c.mu.Lock()
	c.state.ETag = resp.Header.Get("ETag")
	c.state.CachedRelease = info
	c.state.LastCheckedAt = now
	c.state.BackoffUntil = time.Time{}
	c.saveState()
	c.mu.Unlock()
	return c.statusFromRelease(info, now)
}

func retryUntil(resp *http.Response, now time.Time) time.Time {
	if s := strings.TrimSpace(resp.Header.Get("Retry-After")); s != "" {
		if n, err := strconv.Atoi(s); err == nil {
			return now.Add(time.Duration(n) * time.Second)
		}
		if t, err := http.ParseTime(s); err == nil {
			return t
		}
	}
	if s := resp.Header.Get("X-RateLimit-Reset"); s != "" {
		if n, err := strconv.ParseInt(s, 10, 64); err == nil {
			return time.Unix(n, 0)
		}
	}
	return now.Add(5 * time.Minute)
}

func hasAdditionalReleaseContent(body string, notes []string) bool {
	lines := []string{}
	for _, line := range strings.Split(body, "
") {
		s := strings.TrimSpace(strings.TrimLeft(line, "#-*• "))
		if s != "" {
			lines = append(lines, strings.ToLower(s))
		}
	}
	normalized := []string{}
	for _, note := range notes {
		if s := strings.TrimSpace(strings.TrimLeft(note, "-*• ")); s != "" {
			normalized = append(normalized, strings.ToLower(s))
		}
	}
	if len(lines) == 0 {
		return false
	}
	if len(lines) != len(normalized) {
		return true
	}
	for i := range lines {
		if lines[i] != normalized[i] {
			return true
		}
	}
	return false
}

func trimNotes(notes []string) []string {
	out := make([]string, 0, 3)
	for _, n := range notes {
		n = strings.TrimSpace(strings.TrimLeft(n, "-*• "))
		if n != "" {
			out = append(out, n)
			if len(out) == 3 {
				break
			}
		}
	}
	return out
}
func findAsset(a []githubAsset, name string) *githubAsset {
	for i := range a {
		if a[i].Name == name {
			return &a[i]
		}
	}
	return nil
}
func (c *Client) fetchManifest(ctx context.Context, raw string) (Manifest, error) {
	u, err := url.Parse(raw)
	if err != nil || !c.allowedURL(u) {
		return Manifest{}, errors.New("manifest URL is not trusted")
	}
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, raw, nil)
	req.Header.Set("User-Agent", "YGO-Deck-Studio-Updater/1")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return Manifest{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return Manifest{}, fmt.Errorf("manifest returned %s", resp.Status)
	}
	var m Manifest
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&m); err != nil {
		return Manifest{}, err
	}
	if m.Schema != 1 || m.Version == "" || m.AssetName == "" || len(m.SHA256) != 64 || m.Size <= 0 {
		return Manifest{}, errors.New("release manifest is incomplete")
	}
	return m, nil
}
func (c *Client) statusFromRelease(info *ReleaseInfo, now time.Time) Status {
	cmp, err := CompareVersions(c.InstalledVersion, info.Version)
	if err != nil {
		return c.errorStatus(err)
	}
	downloaded := c.isDownloaded(info)
	state := "up_to_date"
	msg := "You are up to date."
	if cmp < 0 {
		state = "available"
		msg = "An update is available."
		if downloaded {
			state = "downloaded"
			msg = "Update downloaded and verified."
		}
	}
	return Status{State: state, InstalledVersion: c.InstalledVersion, Latest: info, Message: msg, LastCheckedAt: now.Format(time.RFC3339), Downloaded: downloaded, DownloadProgress: func() int {
		if downloaded {
			return 100
		}
		return 0
	}()}
}
func (c *Client) errorStatus(err error) Status {
	return Status{State: "error", InstalledVersion: c.InstalledVersion, Latest: c.state.CachedRelease, Message: err.Error(), LastCheckedAt: time.Now().Format(time.RFC3339)}
}

func (c *Client) downloadPath(info *ReleaseInfo) string {
	return filepath.Join(c.DataDir, "downloads", info.Version, info.AssetName)
}
func (c *Client) isDownloaded(info *ReleaseInfo) bool {
	if info == nil {
		return false
	}
	p := c.downloadPath(info)
	ok, _ := validateFile(p, info.SHA256, info.Size, c.AppID, info.Version)
	return ok
}

func (c *Client) VerifyDownloaded() (string, error) {
	c.mu.Lock()
	info := c.status.Latest
	c.mu.Unlock()
	if info == nil {
		return "", errors.New("no update release is selected")
	}
	path := c.downloadPath(info)
	ok, err := validateFile(path, info.SHA256, info.Size, c.AppID, info.Version)
	if !ok {
		if err == nil {
			err = errors.New("download validation failed")
		}
		return "", err
	}
	return path, nil
}

func (c *Client) Download(ctx context.Context) Status {
	c.mu.Lock()
	info := c.status.Latest
	if info == nil || c.status.State != "available" {
		s := c.status
		c.mu.Unlock()
		return s
	}
	c.status.State = "downloading"
	c.status.DownloadProgress = 0
	c.status.Message = "Downloading update..."
	c.mu.Unlock()
	u, err := url.Parse(info.AssetURL)
	if err != nil || !c.allowedURL(u) {
		return c.setError(errors.New("release download URL is not trusted"))
	}
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, info.AssetURL, nil)
	req.Header.Set("User-Agent", "YGO-Deck-Studio-Updater/1")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return c.setError(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return c.setError(fmt.Errorf("download returned %s", resp.Status))
	}
	if resp.ContentLength > c.MaxDownloadBytes {
		return c.setError(errors.New("release asset is too large"))
	}
	final := c.downloadPath(info)
	if err := os.MkdirAll(filepath.Dir(final), 0o755); err != nil {
		return c.setError(err)
	}
	part := final + ".part"
	f, err := os.Create(part)
	if err != nil {
		return c.setError(err)
	}
	h := sha256.New()
	var written int64
	buf := make([]byte, 128*1024)
	for {
		n, rerr := resp.Body.Read(buf)
		if n > 0 {
			written += int64(n)
			if written > c.MaxDownloadBytes {
				f.Close()
				os.Remove(part)
				return c.setError(errors.New("release asset exceeded maximum size"))
			}
			if _, err = f.Write(buf[:n]); err != nil {
				f.Close()
				return c.setError(err)
			}
			_, _ = h.Write(buf[:n])
			pct := 0
			if info.Size > 0 {
				pct = int(written * 100 / info.Size)
				if pct > 99 {
					pct = 99
				}
			}
			c.mu.Lock()
			c.status.DownloadProgress = pct
			c.mu.Unlock()
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			f.Close()
			return c.setError(rerr)
		}
	}
	_ = f.Sync()
	_ = f.Close()
	if info.Size > 0 && written != info.Size {
		os.Remove(part)
		return c.setError(fmt.Errorf("download size mismatch: got %d expected %d", written, info.Size))
	}
	got := hex.EncodeToString(h.Sum(nil))
	if !strings.EqualFold(got, info.SHA256) {
		os.Remove(part)
		return c.setError(errors.New("download SHA-256 mismatch"))
	}
	if err := os.Rename(part, final); err != nil {
		return c.setError(err)
	}
	ok, err := validateFile(final, info.SHA256, info.Size, c.AppID, info.Version)
	if !ok {
		return c.setError(err)
	}
	c.mu.Lock()
	c.status.State = "downloaded"
	c.status.Downloaded = true
	c.status.DownloadProgress = 100
	c.status.DownloadPath = final
	c.status.Message = "Update downloaded and verified."
	s := c.status
	c.mu.Unlock()
	return s
}
func (c *Client) setError(err error) Status {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.status.State = "error"
	c.status.Message = err.Error()
	return c.status
}

func validateFile(path, expectedHash string, expectedSize int64, appID, version string) (bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil {
		return false, err
	}
	if expectedSize > 0 && st.Size() != expectedSize {
		return false, errors.New("candidate size mismatch")
	}
	h := sha256.New()
	if _, err = io.Copy(h, f); err != nil {
		return false, err
	}
	if !strings.EqualFold(hex.EncodeToString(h.Sum(nil)), expectedHash) {
		return false, errors.New("candidate hash mismatch")
	}
	pf, err := pe.Open(path)
	if err != nil {
		return false, fmt.Errorf("candidate is not a valid Windows PE: %w", err)
	}
	defer pf.Close()
	if pf.FileHeader.Machine != pe.IMAGE_FILE_MACHINE_AMD64 {
		return false, errors.New("candidate is not Windows amd64")
	}
	b, err := os.ReadFile(path)
	if err != nil {
		return false, err
	}
	marker := []byte("YGO_UPDATE_ID=" + appID + ";VERSION=" + version + ";")
	if !strings.Contains(string(b), string(marker)) {
		return false, errors.New("candidate app identity/version marker mismatch")
	}
	return true, nil
}
