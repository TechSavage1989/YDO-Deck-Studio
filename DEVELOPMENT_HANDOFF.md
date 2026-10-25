# YGO Deck Studio Development Handoff

## Latest version

3.0.0-alpha.221-duelcore.1-rc237

Previous published baseline: 3.0.0-alpha.221-duelcore.1-rc236. Native Windows install and restart confirmation is pending the owner's updater test.

## Source and repository state

Repository: https://github.com/TechSavage1989/YDO-Deck-Studio

Repository visibility: public. Source parent: a7bf25427186121c0702839042592fb89ffa4279.

RC237 is the next pre-release for testing the published rc236 updater. The only product change is a full installed-version label in the Help window. The complete rc236 Source ZIP was verified against SHA-256 868e11a581aaaf962eb6e61505d8a836d78518099446962321da2f1e860f64be before continuing.

Two errors in the earlier Git text import were restored from that verified package: Windows helper command quoting and release-note newline parsing. These corrections preserve the released rc236 behavior. RC236 release assets are unchanged.

Use the current complete Source ZIP identified in SOURCE_SNAPSHOT.md for the recovered baseline and unchanged web dependencies and artwork. Git records the updated browser entry points, launcher/updater, build tooling, tests, and handoff files. Confirm branch and release state before future changes.

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
6. cross-builds the Windows amd64 launcher
7. validates the built candidate through the updater's download/identity path
8. creates standalone, portable, source, update manifest, and checksum artifacts

## Current focused tests

- tests/test_rc236_update_client_timers.py
- tests/test_rc235_named_identity_legality_explanations.py
- tests/test_rc234_shared_extra_monster_zones.py
- tests/test_rc233_xyz_material_and_final_chain.py
- tests/test_rc232_visual_log_click_routing.py
- tests/test_rc230_exact_material_autosubmit.py
- launcher/updater Go tests, including ETag, throttling, version comparison, candidate validation, and wrong-identity rejection

## Native validation status

RC237 is built as a Windows amd64 GUI PE. The release build runs JavaScript syntax checks, Go updater checks, focused Chromium regressions, and validation of the exact generated launcher. See DUELCORE_VALIDATION_alpha221_duelcore1_rc237.txt for the recorded results.

This Linux environment cannot execute the native Windows GUI, replace a running Windows launcher, or verify Windows process restart, shortcut behavior, visible-window health confirmation, or rollback. Those checks remain pending the owner's test from rc236.

The repository workflow can run source checks without the recovered binary baseline. A tag workflow cannot build release artifacts unless the verified baseline is supplied; manual publication of the prepared assets is separate from hosted build status.

## Security limitations

The updater validates trusted HTTPS GitHub hosts and expected SHA-256 hashes, but the current binaries are not publisher code-signed. SHA-256 matching is integrity verification, not proof of publisher signing.

The update helper is copied to per-user application data only for an explicit install operation and exits after replacement/health verification. No unattended worker or persistent background service is installed.

## Known release-state limitation at handoff

RC236 is published as v3.0.0-alpha.221-duelcore.1-rc236, with six matching release assets. Its original updater client successfully queried the public release feed, fetched the manifest, downloaded and validated the executable, and reused the feed through HTTP 304.

RC237 uses tag v3.0.0-alpha.221-duelcore.1-rc237 and must be published with its exact manifest and executable. Verify live release discovery and download using the unchanged rc236 updater after publication. Do not interpret source publication or a tag alone as a successful release.

Owner test: launch the existing rc236 application, use Check for Updates, select Download, then Install and restart after saving any deck and ending any active duel. Open Help with F1 and confirm the version ends in rc237. Record actual Windows results before claiming replacement or rollback passed.

## Initial public source import

The original initial Git import contained launcher/updater source, tests, build scripts, documentation, workflow, and baseline digest. Browser entry points and focused browser tests are added for rc237. The complete recovered tree, including unchanged browser dependencies, artwork, and the original rc189 executable, is included in the versioned Source ZIP.

The native baseline remains excluded from Git by .gitignore. Validate base/BASELINE_SHA256.txt before use. Do not replace it with an unverified executable.

## Git import completeness

The current Git branch is authoritative for project ownership, versions, changed browser entry points, launcher/updater, and handoff documentation. The complete release Source ZIP is authoritative for the recovered-source tree as a whole. Use its release checksums; do not reconstruct missing files from guesses or older packages.

Python browser test dependencies are listed in requirements-dev.txt. Install them and run python -m playwright install chromium before building. The focused tests use Playwright's installed Chromium instead of a fixed Linux-only browser path.

For an existing Chromium installation, set YGO_CHROMIUM_EXECUTABLE to its full executable path before running the build or focused browser tests.
