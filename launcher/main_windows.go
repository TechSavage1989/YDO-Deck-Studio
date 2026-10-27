//go:build windows

package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"

	"github.com/TechSavage1989/YGO-Deck-Studio/launcher/payload"
	"github.com/TechSavage1989/YGO-Deck-Studio/launcher/updater"
)

const baseUpdatePort = 49357

type appServer struct {
	client         *updater.Client
	targetExe      string
	dataRoot       string
	child          *exec.Cmd
	mu             sync.Mutex
	busy           bool
	lastHeartbeat  time.Time
	healthy        bool
	installPending bool
	updateToken    string
}

type activity struct {
	Dirty       bool   `json:"dirty"`
	DuelRunning bool   `json:"duel_running"`
	Visible     bool   `json:"visible"`
	Version     string `json:"version"`
}

func main() {
	apply := flag.Bool("apply-update", false, "")
	parent := flag.Int("parent-pid", 0, "")
	target := flag.String("target", "", "")
	candidate := flag.String("candidate", "", "")
	version := flag.String("version", "", "")
	data := flag.String("data-root", "", "")
	token := flag.String("post-update-token", "", "")
	flag.Parse()
	if *apply {
		if err := applyUpdate(*parent, *target, *candidate, *version, *data); err != nil {
			writeLastResult(*data, false, *version, err.Error())
		}
		return
	}
	if err := runLauncher(*token); err != nil {
		messageBox("YGO Deck Studio", err.Error())
		os.Exit(1)
	}
}

func runLauncher(postToken string) error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	exe, _ = filepath.Abs(exe)
	dataRoot, err := appDataRoot()
	if err != nil {
		return err
	}
	for _, d := range []string{dataRoot, filepath.Join(dataRoot, "App"), filepath.Join(dataRoot, "Updater"), filepath.Join(dataRoot, "Logs")} {
		if err := os.MkdirAll(d, 0o755); err != nil {
			return err
		}
	}
	corePath, err := ensureCore(dataRoot)
	if err != nil {
		return err
	}
	client := updater.NewClient(AppID, AppVersion, RepoOwner, RepoName, filepath.Join(dataRoot, "Updater"))
	srv := &appServer{client: client, targetExe: exe, dataRoot: dataRoot, updateToken: postToken}
	port, server, err := srv.startHTTP()
	if err != nil {
		return err
	}
	defer server.Shutdown(context.Background())
	cmd := exec.Command(corePath)
	cmd.Env = append(os.Environ(), fmt.Sprintf("YGO_DECK_STUDIO_UPDATE_PORT=%d", port))
	cmd.Dir = filepath.Dir(corePath)
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start application core: %w", err)
	}
	srv.child = cmd
	err = cmd.Wait()
	if srv.installPending {
		return nil
	}
	if err != nil {
		return fmt.Errorf("application core exited unexpectedly: %w", err)
	}
	return nil
}

func appDataRoot() (string, error) {
	base, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, "YGO Deck Studio 3"), nil
}
func ensureCore(root string) (string, error) {
	dir := filepath.Join(root, "App", AppVersion)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	path := filepath.Join(dir, "YGODeckStudioCore.exe")
	sum := sha256.Sum256(payload.Core)
	want := hex.EncodeToString(sum[:])
	if b, err := os.ReadFile(path); err == nil {
		got := sha256.Sum256(b)
		if hex.EncodeToString(got[:]) == want {
			return path, nil
		}
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, payload.Core, 0o700); err != nil {
		return "", err
	}
	if err := os.Rename(tmp, path); err != nil {
		return "", err
	}
	cleanupOldCore(root, dir)
	return path, nil
}
func cleanupOldCore(root, keep string) {
	entries, _ := os.ReadDir(filepath.Join(root, "App"))
	for _, e := range entries {
		p := filepath.Join(root, "App", e.Name())
		if e.IsDir() && p != keep {
			_ = os.RemoveAll(p)
		}
	}
}

func (s *appServer) startHTTP() (int, *http.Server, error) {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/update/ping", s.cors(s.handlePing))
	mux.HandleFunc("/api/update/hello", s.cors(s.handleHello))
	mux.HandleFunc("/api/update/heartbeat", s.cors(s.handleHeartbeat))
	mux.HandleFunc("/api/update/status", s.cors(s.handleStatus))
	mux.HandleFunc("/api/update/check", s.cors(s.handleCheck))
	mux.HandleFunc("/api/update/download", s.cors(s.handleDownload))
	mux.HandleFunc("/api/update/install", s.cors(s.handleInstall))
	for p := baseUpdatePort; p < baseUpdatePort+10; p++ {
		ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", p))
		if err != nil {
			continue
		}
		server := &http.Server{Handler: mux, ReadHeaderTimeout: 5 * time.Second}
		go server.Serve(ln)
		return p, server, nil
	}
	return 0, nil, errors.New("could not start the local update service")
}
func (s *appServer) cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		w.Header().Set("Cache-Control", "no-store")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}
func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}
func (s *appServer) handlePing(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]any{"app_id": AppID, "version": AppVersion, "marker": BuildMarker})
}
func (s *appServer) handleHello(w http.ResponseWriter, r *http.Request) {
	a := s.recordActivity(r)
	s.mu.Lock()
	validHealth := a.Visible && a.Version == AppVersion
	if validHealth {
		s.healthy = true
	}
	token := s.updateToken
	s.mu.Unlock()
	if token != "" && validHealth {
		_ = os.MkdirAll(filepath.Join(s.dataRoot, "Updater", "health"), 0o755)
		_ = os.WriteFile(filepath.Join(s.dataRoot, "Updater", "health", token+".ok"), []byte(AppVersion), 0o600)
	}
	writeJSON(w, map[string]any{"ok": true})
}
func (s *appServer) recordActivity(r *http.Request) activity {
	var a activity
	_ = json.NewDecoder(io.LimitReader(r.Body, 64<<10)).Decode(&a)
	s.mu.Lock()
	s.busy = a.Dirty || a.DuelRunning
	s.lastHeartbeat = time.Now()
	s.mu.Unlock()
	return a
}
func (s *appServer) handleHeartbeat(w http.ResponseWriter, r *http.Request) {
	s.recordActivity(r)
	writeJSON(w, map[string]any{"ok": true})
}
func (s *appServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, s.client.Status())
}
func (s *appServer) handleCheck(w http.ResponseWriter, r *http.Request) {
	manual := r.URL.Query().Get("manual") == "1"
	writeJSON(w, s.client.Check(r.Context(), manual))
}
func (s *appServer) handleDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST required", 405)
		return
	}
	writeJSON(w, s.client.Download(r.Context()))
}
func (s *appServer) handleInstall(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST required", 405)
		return
	}
	st := s.client.Status()
	if st.Latest == nil || !st.Downloaded {
		http.Error(w, "No verified update is ready to install.", 409)
		return
	}
	s.mu.Lock()
	busy := s.busy || time.Since(s.lastHeartbeat) > 20*time.Second
	s.mu.Unlock()
	if busy {
		http.Error(w, "Save your work and end the active duel before installing the update.", 409)
		return
	}
	candidate, err := s.client.VerifyDownloaded()
	if err != nil {
		http.Error(w, "Downloaded update failed revalidation: "+err.Error(), 409)
		return
	}
	helperDir := filepath.Join(s.dataRoot, "Updater", "helper")
	_ = os.MkdirAll(helperDir, 0o755)
	helper := filepath.Join(helperDir, "YGODeckStudioUpdateHelper.exe")
	if err := copyFile(s.targetExe, helper); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	cmd := exec.Command(helper, "--apply-update", "--parent-pid", strconv.Itoa(os.Getpid()), "--target", s.targetExe, "--candidate", candidate, "--version", st.Latest.Version, "--data-root", s.dataRoot)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	if err := cmd.Start(); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	s.mu.Lock()
	s.installPending = true
	s.mu.Unlock()
	writeJSON(w, map[string]any{"ok": true, "restart": true})
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	_, err = io.Copy(out, in)
	if e := out.Sync(); err == nil {
		err = e
	}
	if e := out.Close(); err == nil {
		err = e
	}
	return err
}

func applyUpdate(parent int, target, candidate, version, dataRoot string) error {
	if parent <= 0 || target == "" || candidate == "" || version == "" || dataRoot == "" {
		return errors.New("invalid update helper arguments")
	}
	deadline := time.Now().Add(40 * time.Second)
	for processExists(parent) && time.Now().Before(deadline) {
		time.Sleep(250 * time.Millisecond)
	}
	if processExists(parent) {
		return errors.New("application did not exit for update")
	}
	backupDir := filepath.Join(dataRoot, "Updater", "rollback")
	_ = os.MkdirAll(backupDir, 0o755)
	backup := filepath.Join(backupDir, "YGO Deck Studio 3.previous.exe")
	_ = os.Remove(backup)
	if err := copyFile(target, backup); err != nil {
		return fmt.Errorf("backup failed: %w", err)
	}
	stage := target + ".update.tmp"
	_ = os.Remove(stage)
	if err := copyFile(candidate, stage); err != nil {
		return fmt.Errorf("staging failed: %w", err)
	}
	if err := moveReplace(stage, target); err != nil {
		return fmt.Errorf("replace failed: %w", err)
	}
	token := fmt.Sprintf("%d-%d", time.Now().UnixNano(), os.Getpid())
	health := filepath.Join(dataRoot, "Updater", "health", token+".ok")
	_ = os.Remove(health)
	cmd := exec.Command(target, "--post-update-token", token)
	cmd.Dir = filepath.Dir(target)
	if err := cmd.Start(); err != nil {
		return rollback(target, backup, version, dataRoot, fmt.Errorf("new version failed to start: %w", err))
	}
	deadline = time.Now().Add(35 * time.Second)
	for time.Now().Before(deadline) {
		if b, err := os.ReadFile(health); err == nil && strings.TrimSpace(string(b)) == version {
			_ = os.Remove(health)
			_ = os.Remove(candidate)
			_ = os.Remove(candidate + ".part")
			writeLastResult(dataRoot, true, version, "")
			scheduleSelfDelete()
			return nil
		}
		time.Sleep(350 * time.Millisecond)
	}
	_ = exec.Command("taskkill", "/PID", strconv.Itoa(cmd.Process.Pid), "/T", "/F").Run()
	return rollback(target, backup, version, dataRoot, errors.New("new version did not report a healthy app window"))
}
func rollback(target, backup, version, dataRoot string, cause error) error {
	stage := target + ".rollback.tmp"
	_ = os.Remove(stage)
	if err := copyFile(backup, stage); err == nil {
		_ = moveReplace(stage, target)
		_ = exec.Command(target).Start()
	}
	writeLastResult(dataRoot, false, version, cause.Error())
	return cause
}
func writeLastResult(root string, ok bool, version, msg string) {
	p := filepath.Join(root, "Updater", "last_result.json")
	b, _ := json.Marshal(map[string]any{"ok": ok, "version": version, "message": msg, "at": time.Now().Format(time.RFC3339)})
	_ = os.WriteFile(p, b, 0o600)
}

func scheduleSelfDelete() {
	exe, err := os.Executable()
	if err != nil {
		return
	}
	cmd := exec.Command("cmd", "/C", fmt.Sprintf("ping 127.0.0.1 -n 3 >nul & del /f /q \"%s\"", exe))
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	_ = cmd.Start()
}

var kernel32 = syscall.NewLazyDLL("kernel32.dll")
var procOpenProcess = kernel32.NewProc("OpenProcess")
var procCloseHandle = kernel32.NewProc("CloseHandle")
var procMoveFileExW = kernel32.NewProc("MoveFileExW")
var user32 = syscall.NewLazyDLL("user32.dll")
var procMessageBoxW = user32.NewProc("MessageBoxW")

func processExists(pid int) bool {
	const query = 0x1000
	h, _, _ := procOpenProcess.Call(query, 0, uintptr(uint32(pid)))
	if h == 0 {
		return false
	}
	procCloseHandle.Call(h)
	return true
}
func moveReplace(src, dst string) error {
	sp, _ := syscall.UTF16PtrFromString(src)
	dp, _ := syscall.UTF16PtrFromString(dst)
	r, _, e := procMoveFileExW.Call(uintptr(unsafe.Pointer(sp)), uintptr(unsafe.Pointer(dp)), uintptr(0x1|0x8))
	if r == 0 {
		return e
	}
	return nil
}
func messageBox(title, msg string) {
	t, _ := syscall.UTF16PtrFromString(title)
	m, _ := syscall.UTF16PtrFromString(msg)
	procMessageBoxW.Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(t)), 0x10)
}
