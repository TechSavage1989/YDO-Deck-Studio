YGO DECK STUDIO 3 RC239 - RECOVERED SOURCE AND BUILD PACKAGE

PACKAGE STATUS

The original native Go project source for the rc189 application shell was not recovered. This package contains the maintained browser source, the verified rc189 native baseline used for local builds, the reproducible embedded-web patcher, and the new source-controlled Windows launcher/updater.

The preserved rc189 core remains authoritative for the native application shell and OCGCore integration. Browser-side changes through rc239 are under web/. The rc239 launcher adds the stable portable filename and safe GitHub Releases update path.

REBUILDING RC239

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

UPDATE FEED

Repository:
  https://github.com/TechSavage1989/YDO-Deck-Studio

Expected feed:
  GitHub Releases from the same repository.

A release intended for auto-update must include update-manifest.json and the exact versioned launcher executable named by that manifest. Update installation remains explicit; the app never downloads or restarts automatically.

For an existing Chromium installation, set YGO_CHROMIUM_EXECUTABLE to its full executable path before running the build or focused browser tests.
