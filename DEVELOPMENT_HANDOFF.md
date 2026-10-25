# YGO Deck Studio Development Handoff

## Latest version

3.0.0-alpha.221-duelcore.1-rc241

Previous published baseline: 3.0.0-alpha.221-duelcore.1-rc240. The owner confirmed the rc240 desktop icon is fixed. Native Windows installation and restart are not inferred from icon confirmation.

## Source and repository state

Repository: https://github.com/TechSavage1989/YDO-Deck-Studio

Repository visibility: public. Git parent: bfdd322ea9babad795698f3262cf654451ba9727.

The complete published rc240 Source ZIP was verified against SHA-256 499e37e2a1b5a79b3243cef1177487c9ec89824ff9fba72aace983c9384040ea before continuing. RC241 uses the generic public executable name YGODeckStudio.exe for standalone releases, updater assets, and portable packages. The installed EXE path is preserved during updates so existing shortcuts continue to work. The owner-confirmed rc240 embedded icon remains unchanged.

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
2. the YGODeckStudio.exe Windows executable named by asset_name in the manifest
3. checksums and normal release assets

Manifest app_id must equal com.techsavage1989.ygo-deck-studio.

The launcher does not use GitHub credentials or embedded tokens. Public release downloads are unauthenticated and therefore subject to shared-IP API limits.

## Stable executable and application data

Stable public executable filename: YGODeckStudio.exe

The standalone asset, updater manifest asset_name, and portable EXE use YGODeckStudio.exe. Release tags and ZIP filenames retain the version for archive identification.

The updater always replaces and restarts the actual launcher path returned by Windows. This preserves existing shortcuts, including installations using the old YGO Deck Studio 3.exe name, versioned filenames, or a user-chosen filename. Do not rename an existing target during installation or derive it from the downloaded asset basename. New installations should use the generic name in a permanent writable folder.

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

RC241 is built as a Windows amd64 GUI PE. The release build runs JavaScript syntax checks, Go updater tests, real mouse interactions against source and packaged CSS, focused duel regressions, linked icon resource validation, and validation of the generated candidate. The version comparison tests include the exact rc240 to rc241 transition. Portable ZIP CRC and launcher byte identity are checked during packaging. See DUELCORE_VALIDATION_alpha221_duelcore1_rc241.txt for the recorded results.

This Linux environment cannot execute the native Windows GUI or confirm running-launcher replacement, Windows restart, visible-window health confirmation, shortcuts, or rollback. Those checks remain pending the owner's Windows test.

The repository workflow can run source checks without the recovered baseline. A tag workflow cannot build release artifacts unless that verified baseline is supplied. Publication of validated local artifacts is separate from hosted build status.

## Security limitations

The updater validates trusted HTTPS GitHub hosts and expected SHA-256 hashes, but the current binaries are not publisher code-signed. SHA-256 matching is integrity verification, not proof of publisher signing.

The update helper is copied to per-user application data only for an explicit install operation and exits after replacement/health verification. No unattended worker or persistent background service is installed.

## Known release-state limitation at handoff

RC240 is published. Its six uploaded assets matched the prepared sizes and server SHA-256 digests. The unchanged rc239 updater client discovered and downloaded rc240, including candidate integrity/identity/version validation, an HTTP 304 cache check, and an installed-rc240 up-to-date check. The owner confirmed the desktop icon is fixed.

RC241 uses tag v3.0.0-alpha.221-duelcore.1-rc241. Publish the generic YGODeckStudio.exe asset and its matching manifest with the portable/source ZIPs, validation report, and checksums. After publication, verify all six server asset digests and run the unchanged rc240 updater client against the public feed to confirm that it accepts and downloads the generic asset name.

Owner test from rc240: save work and end active duels, use Check for Updates, select Download, then Install and restart. Press F1 and confirm rc241. Launch the app again through the same desktop shortcut. Existing installed filenames should remain unchanged; new standalone and portable packages use YGODeckStudio.exe.

For affected rc236/rc237 builds, Tab/Enter can activate Download once despite the old mouse-only CSS defect; alternatively use the latest portable package for manual launcher replacement. Do not infer Windows replacement or rollback success from feed/download tests.

## Initial public source import

The original initial Git import contained launcher/updater source, tests, build scripts, documentation, workflow, and baseline digest. Browser entry points and focused browser tests are added for rc237. The complete recovered tree, including unchanged browser dependencies, artwork, and the original rc189 executable, is included in the versioned Source ZIP.

The native baseline remains excluded from Git by .gitignore. Validate base/BASELINE_SHA256.txt before use. Do not replace it with an unverified executable.

## Git import completeness

The current Git branch is authoritative for project ownership, versions, changed browser entry points, launcher/updater, and handoff documentation. The complete release Source ZIP is authoritative for the recovered-source tree as a whole. Use its release checksums; do not reconstruct missing files from guesses or older packages.

Python browser test dependencies are listed in requirements-dev.txt. Install them and run python -m playwright install chromium before building. The focused tests use Playwright's installed Chromium instead of a fixed Linux-only browser path.

For an existing Chromium installation, set YGO_CHROMIUM_EXECUTABLE to its full executable path before running the build or focused browser tests.
