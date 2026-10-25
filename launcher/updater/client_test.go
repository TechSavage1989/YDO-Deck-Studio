package updater

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
)

func TestCompareVersions(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{{"3.0.0-alpha.221-duelcore.1-rc240", "3.0.0-alpha.221-duelcore.1-rc241", -1}, {"3.0.0-alpha.221-duelcore.1-rc235", "3.0.0-alpha.221-duelcore.1-rc241", -1}, {"3.0.0-alpha.221-duelcore.1-rc241", "3.0.0-alpha.221-duelcore.1-rc241", 0}, {"3.0.0", "3.0.0-alpha.221-duelcore.1-rc999", 1}}
	for _, tc := range cases {
		got, err := CompareVersions(tc.a, tc.b)
		if err != nil || got != tc.want {
			t.Fatalf("CompareVersions(%q,%q)=%d,%v want %d", tc.a, tc.b, got, err, tc.want)
		}
	}
}

func TestCheckUsesETagAndCachedRelease(t *testing.T) {
	var calls int32
	var server *httptest.Server
	server = httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/repos/TechSavage1989/YDO-Deck-Studio/releases":
			atomic.AddInt32(&calls, 1)
			if r.Header.Get("If-None-Match") == "etag-one" {
				w.WriteHeader(http.StatusNotModified)
				return
			}
			w.Header().Set("ETag", "etag-one")
			json.NewEncoder(w).Encode([]map[string]any{{
				"tag_name": "v3.0.0-alpha.221-duelcore.1-rc241",
				"html_url": "https://github.com/TechSavage1989/YDO-Deck-Studio/releases/tag/v3.0.0-alpha.221-duelcore.1-rc241",
				"body":     "- first\n- second",
				"assets": []map[string]any{
					{"name": "update-manifest.json", "browser_download_url": server.URL + "/manifest", "size": 100},
					{"name": "YGODeckStudio.exe", "browser_download_url": server.URL + "/YGODeckStudio.exe", "size": 123},
				},
			}})
		case "/manifest":
			json.NewEncoder(w).Encode(Manifest{Schema: 1, AppID: "com.techsavage1989.ygo-deck-studio", Version: "3.0.0-alpha.221-duelcore.1-rc241", Tag: "v3.0.0-alpha.221-duelcore.1-rc241", AssetName: "YGODeckStudio.exe", SHA256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", Size: 123, Notes: []string{"First change", "Second change"}})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	dir := t.TempDir()
	c := NewClient("com.techsavage1989.ygo-deck-studio", "3.0.0-alpha.221-duelcore.1-rc235", "TechSavage1989", "YDO-Deck-Studio", dir)
	c.APIBase = server.URL
	c.HTTP = server.Client()
	u, _ := url.Parse(server.URL)
	c.AllowedHosts = map[string]bool{u.Hostname(): true}
	c.AutoCooldown = 0
	s := c.Check(context.Background(), false)
	if s.State != "available" {
		t.Fatalf("first check state=%s message=%s", s.State, s.Message)
	}
	s = c.Check(context.Background(), false)
	if s.State != "available" {
		t.Fatalf("cached check state=%s message=%s", s.State, s.Message)
	}
	if atomic.LoadInt32(&calls) != 2 {
		t.Fatalf("expected 2 release requests, got %d", calls)
	}
}

func TestRateLimitNeverReportsUpToDate(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Retry-After", "60")
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer server.Close()
	c := NewClient("com.techsavage1989.ygo-deck-studio", "3.0.0-alpha.221-duelcore.1-rc241", "TechSavage1989", "YDO-Deck-Studio", t.TempDir())
	c.APIBase = server.URL
	c.HTTP = server.Client()
	u, _ := url.Parse(server.URL)
	c.AllowedHosts = map[string]bool{u.Hostname(): true}
	c.AutoCooldown = 0
	s := c.Check(context.Background(), false)
	if s.State != "throttled" {
		t.Fatalf("state=%s message=%s", s.State, s.Message)
	}
}

func TestDownloadAndValidateBuiltCandidate(t *testing.T) {
	candidate := os.Getenv("YGO_TEST_CANDIDATE")
	if candidate == "" {
		t.Skip("YGO_TEST_CANDIDATE not set")
	}
	b, err := os.ReadFile(candidate)
	if err != nil {
		t.Fatal(err)
	}
	sum := sha256.Sum256(b)
	hash := hex.EncodeToString(sum[:])
	st, _ := os.Stat(candidate)
	var server *httptest.Server
	server = httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/repos/TechSavage1989/YDO-Deck-Studio/releases":
			json.NewEncoder(w).Encode([]map[string]any{{
				"tag_name": "v3.0.0-alpha.221-duelcore.1-rc241",
				"html_url": "https://example.invalid/release",
				"body":     "",
				"assets": []map[string]any{
					{"name": "update-manifest.json", "browser_download_url": server.URL + "/manifest", "size": 100},
					{"name": "YGODeckStudio.exe", "browser_download_url": server.URL + "/YGODeckStudio.exe", "size": st.Size()},
				},
			}})
		case "/manifest":
			json.NewEncoder(w).Encode(Manifest{Schema: 1, AppID: "com.techsavage1989.ygo-deck-studio", Version: "3.0.0-alpha.221-duelcore.1-rc241", Tag: "v3.0.0-alpha.221-duelcore.1-rc241", AssetName: "YGODeckStudio.exe", SHA256: hash, Size: st.Size(), Notes: []string{"Updater test"}})
		case "/YGODeckStudio.exe":
			http.ServeFile(w, r, candidate)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	c := NewClient("com.techsavage1989.ygo-deck-studio", "3.0.0-alpha.221-duelcore.1-rc235", "TechSavage1989", "YDO-Deck-Studio", t.TempDir())
	c.APIBase = server.URL
	c.HTTP = server.Client()
	u, _ := url.Parse(server.URL)
	c.AllowedHosts = map[string]bool{u.Hostname(): true}
	c.AutoCooldown = 0
	c.MaxDownloadBytes = st.Size() + 1024
	previous := filepath.Join(c.DataDir, "downloads", "3.0.0-alpha.221-duelcore.1-rc240", "YGODeckStudio.exe")
	if err := os.MkdirAll(filepath.Dir(previous), 0o755); err != nil {
		t.Fatal(err)
	}
	previousBytes := []byte("previous cached release must remain separate")
	if err := os.WriteFile(previous, previousBytes, 0o600); err != nil {
		t.Fatal(err)
	}
	s := c.Check(context.Background(), false)
	if s.State != "available" {
		t.Fatalf("check=%s %s", s.State, s.Message)
	}
	s = c.Download(context.Background())
	if s.State != "downloaded" || !s.Downloaded {
		t.Fatalf("download=%s %s", s.State, s.Message)
	}
	wantPath := filepath.Join(c.DataDir, "downloads", s.Latest.Version, "YGODeckStudio.exe")
	path, err := c.VerifyDownloaded()
	if err != nil || path != wantPath {
		t.Fatalf("generic executable revalidation path=%q error=%v, want %q", path, err, wantPath)
	}
	if _, err := os.Stat(wantPath); err != nil {
		t.Fatal(err)
	}
	if got, err := os.ReadFile(previous); err != nil || string(got) != string(previousBytes) {
		t.Fatalf("generic asset name overwrote the previous release cache: %q, %v", got, err)
	}
}

func TestWrongIdentityCandidateRejected(t *testing.T) {
	candidate := os.Getenv("YGO_TEST_CANDIDATE")
	if candidate == "" {
		t.Skip("YGO_TEST_CANDIDATE not set")
	}
	b, err := os.ReadFile(candidate)
	if err != nil {
		t.Fatal(err)
	}
	sum := sha256.Sum256(b)
	hash := hex.EncodeToString(sum[:])
	st, _ := os.Stat(candidate)
	ok, err := validateFile(candidate, hash, st.Size(), "wrong.app.id", "3.0.0-alpha.221-duelcore.1-rc241")
	if ok || err == nil {
		t.Fatal("wrong identity candidate was accepted")
	}
}
