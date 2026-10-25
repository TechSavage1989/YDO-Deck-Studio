# YGO Deck Studio - Read First

## Current baseline

The current development baseline is 3.0.0-alpha.221-duelcore.1-rc239.

This project is a recovered-source continuation. The original native Go source for the rc189 application shell was not available. The current browser entry points, launcher/updater, tests, and release handoff are maintained in Git. The complete recovered-source tree, including web dependencies, artwork, and the verified rc189 native baseline, is distributed in the versioned Source ZIP identified in SOURCE_SNAPSHOT.md. Use that complete snapshot together with newer confirmed Git changes; do not reconstruct missing files from older revisions. tools/patch_embedded_web.py patches the maintained browser assets into the verified rc189 native baseline before the launcher embeds that core executable.

Do not replace the recovered native baseline or reconstruct duel-engine behavior unless the project owner explicitly requests it.

## Repository and release feed

Repository: https://github.com/TechSavage1989/YDO-Deck-Studio

Expected release feed: GitHub Releases from the same repository.

App identity: com.techsavage1989.ygo-deck-studio

Default portable launch filename: YGO Deck Studio 3.exe

Do not change repository visibility, publish source, create credentials, embed tokens, overwrite a published release, or change release ownership without explicit owner approval.

## Versioning

Increment the release candidate consistently in:

- launcher/version.go
- tools/patch_embedded_web.py
- web/index.html
- web/js/app.js
- web/js/duel-core.js
- release changelog and validation filenames

Published tags use v followed by the complete application version. Never reuse an existing tag or overwrite its release assets.

## Build

Primary build command:

Windows:
py -3 scripts\build_release.py --out dist

Linux/macOS development environments with Go and Python:
python3 scripts/build_release.py --out dist

The build produces a versioned standalone Windows executable, a portable ZIP containing the stable launch filename, source ZIP, update-manifest.json, validation report when present, and SHA-256 manifest.

## Tests

Run at minimum:

- node --check web/js/app.js
- node --check web/js/duel-core.js
- go test ./launcher/updater
- python tests/test_rc236_update_client_timers.py
- python tests/test_rc238_update_banner_clicks.py (loads source and packaged stylesheets; real mouse clicks only)
- current targeted duel-selection, Xyz-material, shared-EMZ, visual-log, and named-identity regressions

The release builder runs the current focused set automatically.

## Update architecture

The stable launcher embeds the current recovered native core and starts it from per-user application storage. The browser UI discovers the launcher's loopback update service and performs scheduling/UI only. The launcher performs GitHub release queries, ETag/backoff handling, download validation, staging, replacement, health confirmation, and rollback.

Automatic checks occur at startup, every five minutes while active/online, and on focus/visibility return after two minutes. Automatic download/install/restart is prohibited.

Update release requirements:

- update-manifest.json asset
- versioned Windows launcher executable named by update-manifest.json
- matching SHA-256 and file size in the manifest
- GitHub Release tag matching the manifest tag

A matching hash is integrity validation, not publisher code signing.

## Data locations

Launcher/updater data on Windows:

%LOCALAPPDATA%\YGO Deck Studio 3\

Important subfolders:

- App - extracted current core payload
- Updater - ETag/cache state, downloads, helper, health markers, last result, and one rollback backup
- Logs - reserved launcher/update diagnostics

Do not persist updater downloads, caches, staging files, or settings beside the portable executable. Temporary same-volume replacement files may exist beside the executable only during an install and must be cleaned after the helper exits.

## Preservation rules

Preserve working deck editor, duel simulator, settings, visual design, rules integration, visual Duel Log, attack effects/audio, Direct Hand/Field selection, Xyz-material handling, shared Extra Monster Zone mapping, and existing user data unless a requested change requires otherwise.

OCGCore remains authoritative for duel legality. UI work must not silently override engine candidate lists or rules decisions.
