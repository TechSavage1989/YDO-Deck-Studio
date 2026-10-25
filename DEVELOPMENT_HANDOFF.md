# YGO Deck Studio Development Handoff

## Latest version

3.0.0-alpha.221-duelcore.1-rc238

Previous published baseline: 3.0.0-alpha.221-duelcore.1-rc237. The owner reported that the update is detected in rc236 but Download cannot be clicked. Native Windows install and restart confirmation is still pending.

## Source and repository state

Repository: https://github.com/TechSavage1989/YDO-Deck-Studio

Repository visibility: public. Git parent: b49273ceff4d7df65deaf663174e7acb4b267f6f.

The complete published rc237 Source ZIP was verified against SHA-256 6d8ef75857cafba0ae516fff6633f4f6b503665852745301ad1b8d24122de703 before continuing. RC238 fixes the update banner's blocked Download mouse interaction. The version label added in rc237 is retained.

Root cause: available updates received the is-progress class, whose stylesheet applied pointer-events:none to Download. The earlier isolated updater test omitted the stylesheet and therefore did not exercise the actual mouse hit target. Available updates no longer receive the progress class; dimmed button styling follows the actual disabled state.

The new regression uses real mouse clicks with both the source stylesheet and the stylesheet extracted from the generated native core, at 823 and 1280 pixel viewport widths. The existing timer and restart-guard test now loads the full stylesheet. Keyboard Tab/Enter recovery was reproduced with the unfixed rc237 source and stylesheet before applying the fix.

Use the versioned complete Source ZIP identified in SOURCE_SNAPSHOT.md for recovered binary assets and unchanged browser dependencies. Published rc236 and rc237 artifacts remain unchanged.

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
- tests/test_rc238_update_banner_clicks.py
- tests/test_rc235_named_identity_legality_explanations.py
- tests/test_rc234_shared_extra_monster_zones.py
- tests/test_rc233_xyz_material_and_final_chain.py
- tests/test_rc232_visual_log_click_routing.py
- tests/test_rc230_exact_material_autosubmit.py
- launcher/updater Go tests, including ETag, throttling, version comparison, candidate validation, and wrong-identity rejection

## Native validation status

RC238 is built as a Windows amd64 GUI PE. The release build runs JavaScript syntax checks, Go updater checks, focused Chromium regressions, real mouse interaction against source and packaged CSS, and validation of the generated candidate. Portable ZIP CRC and exact launcher byte identity are checked during packaging. See DUELCORE_VALIDATION_alpha221_duelcore1_rc238.txt for recorded results.

This Linux environment cannot execute the native Windows GUI or verify actual running-launcher replacement, Windows restart, visible-window health confirmation, shortcuts, or rollback. Those native checks remain pending the owner's test.

The repository workflow can run source checks without the recovered baseline. A tag workflow cannot build release artifacts unless the verified baseline is supplied. Publication of validated local artifacts is separate from hosted build status.

## Security limitations

The updater validates trusted HTTPS GitHub hosts and expected SHA-256 hashes, but the current binaries are not publisher code-signed. SHA-256 matching is integrity verification, not proof of publisher signing.

The update helper is copied to per-user application data only for an explicit install operation and exits after replacement/health verification. No unattended worker or persistent background service is installed.

## Known release-state limitation at handoff

RC236 and RC237 are published. The original rc236 updater client successfully discovered rc237, fetched its manifest, downloaded and validated the executable, and reused the feed through HTTP 304. This validates the backend/feed path but did not validate the Windows application's mouse interaction.

The owner supplied a screenshot from rc236 showing rc237 available and a dimmed Download button. The exact mouse blocker was reproduced with the real stylesheet, and Tab/Enter was verified to activate the affected Download button.

RC238 uses tag v3.0.0-alpha.221-duelcore.1-rc238 and must be published with its matching manifest and executable. Verify all six uploaded assets and the public updater feed after publication.

Recovery from affected rc236/rc237: click Check again and wait until rc238 is shown, press Tab until Download is focused, then press Enter. Once download completes, choose Install and restart. Alternatively, close the app and replace the launcher from the rc238 portable package. Preserve the actual executable path and shortcut target. After restart, press F1 and confirm rc238 in Help.

Do not claim native Windows replacement or rollback passed until the owner confirms it.

## Initial public source import

The original initial Git import contained launcher/updater source, tests, build scripts, documentation, workflow, and baseline digest. Browser entry points and focused browser tests are added for rc237. The complete recovered tree, including unchanged browser dependencies, artwork, and the original rc189 executable, is included in the versioned Source ZIP.

The native baseline remains excluded from Git by .gitignore. Validate base/BASELINE_SHA256.txt before use. Do not replace it with an unverified executable.

## Git import completeness

The current Git branch is authoritative for project ownership, versions, changed browser entry points, launcher/updater, and handoff documentation. The complete release Source ZIP is authoritative for the recovered-source tree as a whole. Use its release checksums; do not reconstruct missing files from guesses or older packages.

Python browser test dependencies are listed in requirements-dev.txt. Install them and run python -m playwright install chromium before building. The focused tests use Playwright's installed Chromium instead of a fixed Linux-only browser path.

For an existing Chromium installation, set YGO_CHROMIUM_EXECUTABLE to its full executable path before running the build or focused browser tests.
