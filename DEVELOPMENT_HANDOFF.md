# YGO Deck Studio Development Handoff

## Latest version

3.0.0-alpha.221-duelcore.1-rc240

Previous published baseline: 3.0.0-alpha.221-duelcore.1-rc239. Native Windows installation and restart still require owner confirmation.

## Source and repository state

Repository: https://github.com/TechSavage1989/YDO-Deck-Studio

Repository visibility: public. Git parent: 749445792005df0bfb1d0e576e1b78229ae080ff.

The complete published rc239 Source ZIP was verified against SHA-256 1349f80784705c1e62155ec4a9a15073e29dbdd910425304385081b7809d7f1c before continuing. RC240 restores the original Windows application icon in the outer launcher. RC239 had no PE resource directory, which explains the generic desktop icon. The application still launched; no shortcut-target repair is needed for that symptom.

The rc238 Download-button correction is retained. Available updates must not receive progress-only interaction restrictions. The existing real mouse regressions continue to load source and packaged native stylesheets at 823 and 1280 pixel viewport widths.

Use the complete versioned Source ZIP identified in SOURCE_SNAPSHOT.md for recovered binary assets and unchanged dependencies. Published rc236, rc237, and rc238 artifacts remain unchanged.

## Architecture

The project still preserves the recovered rc189 native Go application core because its original native source is unavailable. Browser assets are rebuilt into that verified binary with tools/patch_embedded_web.py.

RC236 adds a new source-controlled Windows launcher around the recovered core. The launcher:

- uses a stable launch path and filename
- extracts the current core to per-user Local AppData
- hosts a loopback-only update service while the app is running
- checks the repository's GitHub Releases feed
- uses ETags and cached release results
- honors Retry-After and GitHub rate-limit reset headers
- validates download URL hosts, SHA-256, size, PE architecture, app identity, and version
- retains only one rollback backup
- stages replacement on the target filesystem
- restarts only after explicit user action
- waits for the new browser UI to report healthy and rolls back if it does not

The existing browser application owns update scheduling and presentation. It checks at startup, every five minutes while active and online, and after focus/visibility return when the last check is at least two minutes old.

## Release/update feed contract

Repository owner/name: TechSavage1989/YDO-Deck-Studio

Release collection: GitHub Releases API for the repository. Draft releases are ignored. Pre-release releases are supported.

Every application release intended for auto-update must contain:

1. update-manifest.json
2. the exact versioned Windows executable named by asset_name in the manifest
3. checksums and normal release assets

Manifest app_id must equal com.techsavage1989.ygo-deck-studio.

The launcher does not use GitHub credentials or embedded tokens. Public release downloads are unauthenticated and therefore subject to shared-IP API limits.

## Stable executable and application data

Portable launch filename: YGO Deck Studio 3.exe

The updater always replaces the actual launcher path returned by Windows, so a user-renamed launcher is updated in place rather than forcing the default filename.

Windows data root:

%LOCALAPPDATA%\YGO Deck Studio 3\

Updater state:

%LOCALAPPDATA%\YGO Deck Studio 3\Updater\

Current extracted core:

%LOCALAPPDATA%\YGO Deck Studio 3\App\<version>\YGODeckStudioCore.exe

Existing deck/app settings remain owned by the recovered application and are not moved or deleted by the launcher.

## Build commands

Full release build:

py -3 scripts\build_release.py --out dist

The release builder:

1. verifies and patches the rc189 native baseline with current web assets
2. writes the generated core payload for the launcher
3. runs JavaScript syntax checks
4. runs updater Go tests
5. runs focused Playwright regressions
6. cross-builds the Windows amd64 launcher with the checked-in icon resource object and validates all linked icon images
7. validates the built candidate through the updater's download/identity path
8. creates standalone, portable, source, update manifest, and checksum artifacts

## Current focused tests

- tests/test_rc236_update_client_timers.py
- tests/test_rc238_update_banner_clicks.py
- tests/test_rc235_named_identity_legality_explanations.py
- tests/test_rc234_shared_extra_monster_zones.py
- tests/test_rc233_xyz_material_and_final_chain.py
- tests/test_rc232_visual_log_click_routing.py
- tests/test_rc230_exact_material_autosubmit.py
- launcher/updater Go tests, including ETag, throttling, version comparison, candidate validation, and wrong-identity rejection

## Launcher icon build

launcher/rsrc_windows_amd64.syso contains the original seven application icon images, from 16 through 256 pixels. Go links this Windows amd64 object at compilation. The source icon is web/assets/app_icon.ico. tools/generate_windows_icon.py regenerates the object with github.com/akavel/rsrc pinned to v0.10.2, preserving image bytes and normalizing zero-plane ICO metadata to one plane for Windows group descriptors. Ordinary builds do not download this tool.

tools/validate_windows_icon.py reads the finished launcher PE resource tree and verifies the primary group, metadata, and every icon image against the source ICO. The release builder runs this check even with --skip-tests. This check rejects the published rc239 launcher because it has no resource directory. The recovered original baseline provides an independent positive check. Never modify the completed EXE to insert an icon.

## Native validation status

RC240 is built as a Windows amd64 GUI PE. The release build runs JavaScript syntax checks, Go updater tests, real mouse interactions against source and packaged CSS, focused duel regressions, linked icon resource validation, and validation of the generated candidate. The version comparison tests include the exact rc239 to rc240 transition. Portable ZIP CRC and launcher byte identity are checked during packaging. See DUELCORE_VALIDATION_alpha221_duelcore1_rc240.txt for the recorded results.

This Linux environment cannot execute the native Windows GUI or confirm running-launcher replacement, Windows restart, visible-window health confirmation, shortcuts, or rollback. Those checks remain pending the owner's Windows test.

The repository workflow can run source checks without the recovered baseline. A tag workflow cannot build release artifacts unless that verified baseline is supplied. Publication of validated local artifacts is separate from hosted build status.

## Security limitations

The updater validates trusted HTTPS GitHub hosts and expected SHA-256 hashes, but the current binaries are not publisher code-signed. SHA-256 matching is integrity verification, not proof of publisher signing.

The update helper is copied to per-user application data only for an explicit install operation and exits after replacement/health verification. No unattended worker or persistent background service is installed.

## Known release-state limitation at handoff

RC239 is published. Its six uploaded assets matched the prepared sizes and server SHA-256 digests. The unchanged rc238 updater client discovered and downloaded rc239, including candidate integrity/identity/version validation, an HTTP 304 cache check, and an installed-rc239 up-to-date check. Native Windows replacement and desktop icon display remain owner checks.

RC240 uses tag v3.0.0-alpha.221-duelcore.1-rc240. Publish its matching manifest and executable together with the portable/source ZIPs, validation report, and checksums. After publication, verify all six server asset digests and run the unchanged rc239 updater client against the public feed to confirm rc240 discovery and download validation.

Owner test from rc239: use Check for Updates, select Download, then Install and restart after saving any deck and ending an active duel. Press F1 after restart and confirm rc240. Check the desktop shortcut image. If Windows keeps the generic cached image, refresh the desktop or open the shortcut properties and reselect its icon from the updated launcher EXE.

For affected rc236/rc237 builds, Tab/Enter can activate Download once despite the old mouse-only CSS defect; alternatively use the latest portable package for manual launcher replacement. Do not infer Windows replacement, icon-cache refresh, or rollback success from feed/download tests.

## Initial public source import

The original initial Git import contained launcher/updater source, tests, build scripts, documentation, workflow, and baseline digest. Browser entry points and focused browser tests are added for rc237. The complete recovered tree, including unchanged browser dependencies, artwork, and the original rc189 executable, is included in the versioned Source ZIP.

The native baseline remains excluded from Git by .gitignore. Validate base/BASELINE_SHA256.txt before use. Do not replace it with an unverified executable.

## Git import completeness

The current Git branch is authoritative for project ownership, versions, changed browser entry points, launcher/updater, and handoff documentation. The complete release Source ZIP is authoritative for the recovered-source tree as a whole. Use its release checksums; do not reconstruct missing files from guesses or older packages.

Python browser test dependencies are listed in requirements-dev.txt. Install them and run python -m playwright install chromium before building. The focused tests use Playwright's installed Chromium instead of a fixed Linux-only browser path.

For an existing Chromium installation, set YGO_CHROMIUM_EXECUTABLE to its full executable path before running the build or focused browser tests.
