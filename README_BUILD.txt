YGO DECK STUDIO 3 RC241 - RECOVERED SOURCE AND BUILD PACKAGE

PACKAGE STATUS

The original native Go project source for the rc189 application shell was not recovered. This package contains the maintained browser source, the verified rc189 native baseline used for local builds, the reproducible embedded-web patcher, and the new source-controlled Windows launcher/updater.

The preserved rc189 core remains authoritative for the native application shell and OCGCore integration. Browser-side changes through rc241 are under web/. The rc241 launcher adds the stable portable filename and safe GitHub Releases update path.

REBUILDING RC241

Windows:
  py -3 scripts\build_release.py --out dist

Linux/macOS development environments with Go, Python, Node, and Chromium/Playwright available:
  python3 scripts/build_release.py --out dist

Install browser test dependencies before building:
  python -m pip install -r requirements-dev.txt
  python -m playwright install chromium

The build verifies the rc189 baseline SHA-256, patches the maintained embedded web files, runs focused tests, cross-builds the Windows launcher, validates the generated candidate, and creates standalone/portable/source/update-manifest/checksum artifacts.

RECOVERED BASELINE

Required local file:
  base\YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc189_Base.exe

Validate it against base\BASELINE_SHA256.txt. The recovered native baseline executable is distributed separately from the initial Git source import and must not be replaced with an unverified similarly named file.

STABLE EXECUTABLE NAME

The standalone release asset, manifest asset_name, and portable EXE use YGODeckStudio.exe. The filename contains no release version. Versioned ZIP names and release tags are kept for archive identification. Updates replace the actual running launcher in place and restart the same path, preserving shortcuts for legacy and custom names as well. Existing files are not renamed during installation.

WINDOWS APPLICATION ICON

launcher\rsrc_windows_amd64.syso is a checked-in Windows amd64 resource object. Go links it into the launcher during compilation. Ordinary builds do not require a separate resource compiler.

After changing web\assets\app_icon.ico, regenerate the object:
  python tools\generate_windows_icon.py

Regeneration uses github.com/akavel/rsrc pinned to v0.10.2 and may download that build tool. It preserves every image byte and normalizes the source ICO plane metadata for the Windows group descriptor. No application runtime dependency is added. The release builder reads the finished PE resource directory and verifies all seven icon images against the source ICO. A missing or stale icon fails the build. The finished EXE is never modified to add the icon.

UPDATE FEED

Repository:
  https://github.com/TechSavage1989/YDO-Deck-Studio

Expected feed:
  GitHub Releases from the same repository.

A release intended for auto-update must include update-manifest.json and the exact YGODeckStudio.exe launcher asset named by that manifest. Update installation remains explicit; the app never downloads or restarts automatically.

For an existing Chromium installation, set YGO_CHROMIUM_EXECUTABLE to its full executable path before running the build or focused browser tests.
