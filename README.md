<h1 align="center">YGO Deck Studio</h1>

<p align="center"><strong>Build a deck. Test your ideas. Review the duel.</strong></p>

A **Windows desktop deck builder and integrated test-duel application**, with a configurable Practice Dummy, visual Duel Log, replay tools, and a built-in GitHub Releases updater.

<p align="center"><a href="https://github.com/TechSavage1989/YDO-Deck-Studio/releases">Download preview · Releases</a> · <a href="#getting-started">Get started</a> · <a href="#features">Features</a> · <a href="#updates-and-settings">Updates</a> · <a href="#development">Development</a></p>

> **Preview software:** the maintained line is an alpha/release-candidate build. Choose the newest published preview in Releases and read its notes. The application is **YGO Deck Studio**; the repository's existing name is `YDO-Deck-Studio`.

## Features

| Build | Practice | Review |
| --- | --- | --- |
| Create/load decks and organize deck-library directories. | Choose a Practice Dummy deck, intelligence, and turn order. | Inspect the visual Duel Log and replay recorded decisions. |
| Scan supported deck files, including YDK and YDKE. | Test through the integrated OCGCore rules engine. | Seek through live history and branch with a new decision. |
| Keep recent decks and reconnect saved library folders. | Use prompt-window or eligible direct hand/field selection. | Reset a duel with its captured setup and a fresh shuffle. |

## Download

Choose the newest published preview in [Releases](https://github.com/TechSavage1989/YDO-Deck-Studio/releases). Under **Assets**, use `YGODeckStudio.exe` or the versioned **Portable** ZIP. The **Source** ZIP is for developers.

## Requirements

- **Windows x64** and a permanent writable folder for the launcher.
- Microsoft Edge / **Microsoft Edge WebView2 Runtime** kept current, particularly for directory-picker support.
- Network access for card/rules-package downloads and GitHub update checks.
- Independent backups of important deck files. A portable EXE does **not** mean all application data stays beside it.

## Getting started

1. Open [Releases](https://github.com/TechSavage1989/YDO-Deck-Studio/releases) and select the newest published preview. Under **Assets**, download **`YGODeckStudio.exe`**, or choose the versioned **Portable** ZIP and extract it first. The **Source** ZIP is for development.
2. Place `YGODeckStudio.exe` in a permanent writable folder and launch it. Point any new shortcuts to that file.
3. Load or build your player deck. To index existing folders, open **File → Deck Library Directories → Add Directory** and grant read access.
4. Press **F1** for Help and the full installed version. See the [user manual](docs/USER_MANUAL.txt) for selection, replay, and library behavior.

## How to use

1. Load or build the player deck, then choose **Test Duel**.
2. Choose **Practice Dummy Intelligence**: Passive, Casual, Competitive, or Expert.
3. Select **Turn Order** and a **Practice Dummy Deck**—clone the current deck, choose a recent/library deck, or use **Other Location** without replacing your player deck.
4. Select **Start Duel**. OCGCore remains authoritative for legal choices.
5. Use **Replay** to review recorded decisions, or **Reset Duel** for a fresh duel with the same captured setup. A new decision after a live-history seek replaces the recorded future from that branch point.

## Updates and settings

Use **Check for Updates → Download → Install and restart**. Save your work and end active duels first. Automatic checks run at startup, every five minutes while active/online, and on focus/visibility return after two minutes. **Downloads, installation, and restart are never automatic.**

New standalone, updater, and portable downloads use **`YGODeckStudio.exe`**. Updates replace the actual running launcher path in place, preserving shortcuts even if an existing installation uses an older or custom filename. Do not rename an existing target just to match the download.

The updater validates the expected repository, HTTPS hosts, SHA-256, size, application identity, and version, and retains one rollback backup. **The binaries are not publisher code-signed**; matching checksums establish integrity, not publisher signing. Native Windows replacement, restart, shortcut, and rollback checks remain subject to the [documented validation limits](DEVELOPMENT_HANDOFF.md#native-validation-status).

## Troubleshooting

Launcher/core/updater files are stored under:

```text
%LOCALAPPDATA%\YGO Deck Studio 3\
```

`App` contains the extracted core; `Updater` contains cache, staging, helper, health markers, and rollback state. Existing deck/application settings remain owned by the recovered application and are not moved or deleted by the launcher. Use **File → Open Application Data Folder** to inspect card data, rules packages, browser data, and related files.

| If you see… | Try… |
| --- | --- |
| A library folder needs access | **Reconnect** in Deck Library Directories. |
| New/changed deck files are missing | **Refresh Library** or **Refresh All**. |
| The directory chooser is unavailable | Update Edge and WebView2 Runtime. |
| Duel rules are unavailable | Refresh/update the **Duel Rules Package** in Simulator settings. |
| An older rc236/rc237 Download button ignores mouse clicks | Tab/Enter can activate it; alternatively use the current portable package for manual launcher replacement. |

The library scans up to 2,500 recognized deck files, 12 directory levels, and 4 MB per file. See the [full manual](docs/USER_MANUAL.txt) for all supported formats and interaction details, and the [legal notice](docs/LEGAL_NOTICE.txt) for third-party material.

## Development

Read [AGENTS.md](AGENTS.md) and [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md) before editing. This is a **recovered-source continuation**, not a complete reconstruction of the original native application.

<details>
<summary><strong>Source completeness, build prerequisites, and architecture</strong></summary>

The original native Go source for the rc189 application shell was not recovered. The maintained browser assets are patched into its verified native baseline, then embedded by the source-controlled Windows launcher. Do not substitute an unverified executable or reconstruct missing native behavior.

Git contains current browser entry points, launcher/updater, tests, build scripts, and handoff documentation. Start with the complete versioned **Source ZIP identified in [SOURCE_SNAPSHOT.md](SOURCE_SNAPSHOT.md)** for unchanged web dependencies, artwork, and the recovered native baseline, then apply newer confirmed Git changes. Verify the baseline against [base/BASELINE_SHA256.txt](base/BASELINE_SHA256.txt); it is intentionally excluded from Git.

Use Go, Python, Node.js, and the Python browser-test dependencies in `requirements-dev.txt`. Install Playwright Chromium before the focused tests. See [README_BUILD.txt](README_BUILD.txt) and the handoff for the complete build workflow.

```text
# Windows
py -3 scripts\build_release.py --out dist

# Linux/macOS development host (builds the Windows application)
python3 scripts/build_release.py --out dist
```

The builder runs syntax/updater/focused browser checks, links and verifies the original icon, and produces the stable EXE, portable/source ZIPs, updater manifest, and checksums. It does not establish native Windows GUI/update success when run on Linux. Hosted source checks without the recovered baseline are not a full release build.

The launcher owns release queries, validated downloads, replacement, health checks, and rollback. The browser UI owns update scheduling/presentation and discovers the launcher's loopback-only service. No persistent update service is installed.

</details>
