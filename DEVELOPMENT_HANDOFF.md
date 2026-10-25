# YGO Deck Studio Development Handoff

## Latest version

3.0.0-alpha.221-duelcore.1-rc236

Previous confirmed working baseline used for this release: 3.0.0-alpha.221-duelcore.1-rc235.

## Source and repository state

Repository: https://github.com/TechSavage1989/YDO-Deck-Studio

Repository visibility observed during rc236 work: public.

At the start of rc236 work the repository contained only the initial main-branch commit and no application files, AGENTS.md, DEVELOPMENT_HANDOFF.md, or GitHub Releases. Therefore rc235 from the supplied source package was the newest confirmed application source and was used as the development baseline.

RC236 is the initial application source baseline authorized for publication to the repository main branch. Confirm the current main-branch head and GitHub Releases state before future work. GitHub Releases remain a separate publication step and are not implied by a source push.

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

The rc236 launcher is cross-compiled as a Windows amd64 GUI PE and its candidate executable is parsed and validated by the updater tests. This development environment cannot launch Windows GUI executables, so full native Windows launch, visible-window health, target-drive replacement, shortcut behavior, and automatic rollback were not executed locally.

The prepared GitHub Actions workflow includes artifact builds and a Windows smoke job, but hosted CI cannot be considered verified until the workflow is actually committed and runs in the repository.

## Security limitations

The updater validates trusted HTTPS GitHub hosts and expected SHA-256 hashes, but the current binaries are not publisher code-signed. SHA-256 matching is integrity verification, not proof of publisher signing.

The update helper is copied to per-user application data only for an explicit install operation and exits after replacement/health verification. No unattended worker or persistent background service is installed.

## Known release-state limitation at handoff

At rc236 development start, the public repository had no Releases. Until a release containing update-manifest.json and the matching executable is published, the app correctly reports that the update feed has no published application release. It must not report this condition as "up to date."

## Initial public source import

The project owner explicitly authorized pushing the initial source and relevant handoff/build information to the public repository. The initial Git source import includes the rc236 launcher/updater source, updater tests, build/release scripts, documentation, handoff files, changelog, workflow, and baseline digest. The complete maintained browser source, web binary assets, and recovered rc189 native baseline remain in the delivered rc236 Source ZIP because the connected GitHub write interface used for this import cannot stream those large local files directly. Do not treat the Git checkout alone as a complete recovered-source build until those files are synchronized through a normal Git file transfer. base/BASELINE_SHA256.txt remains authoritative for validating the separately supplied recovered baseline.


## Git import completeness

Current GitHub `main` is the authoritative handoff for project ownership, versioning, launcher/updater work, and update architecture. The delivered rc236 Source ZIP remains the authoritative complete recovered-source snapshot for the browser tree and binary assets until a normal Git binary/source synchronization is performed. Future work must not reconstruct missing browser files from guesses or older versions.
