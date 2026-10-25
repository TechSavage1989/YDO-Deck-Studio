# YGO Deck Studio

YGO Deck Studio is a Windows desktop deck-building and integrated test-duel application.

The current recovered-source development line preserves the existing native application core and browser UI while adding a source-controlled stable launcher and safe GitHub Releases update path. Current version: 3.0.0-alpha.221-duelcore.1-rc238. Help displays the full installed version. Git contains current application entry points, launcher/updater, tests, and handoff files. Use the complete versioned Source ZIP described in SOURCE_SNAPSHOT.md for unchanged web dependencies, artwork, and the recovered native baseline.

Read AGENTS.md before development and DEVELOPMENT_HANDOFF.md before continuing work from another chat or environment.

## Build

Run scripts/build_release.py. The default output directory is dist.

## Repository

https://github.com/TechSavage1989/YDO-Deck-Studio


## Recovered native baseline

The original native Go source for the rc189 application shell was not recovered. The release build process patches the maintained browser source into the verified rc189 baseline executable. The baseline executable itself is intentionally not stored in this initial Git source import; verify any local copy against base/BASELINE_SHA256.txt before building. The complete versioned source package delivered with the release contains the recovered baseline used for reproducible local builds.
