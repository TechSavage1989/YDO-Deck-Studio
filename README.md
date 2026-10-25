# YGO Deck Studio

YGO Deck Studio is a Windows desktop deck-building and integrated test-duel application.

The current recovered-source development line preserves the existing native application core and browser UI while adding a source-controlled stable launcher and safe GitHub Releases update path. The initial Git import contains the launcher/updater and project handoff; the complete rc236 recovered browser/source snapshot is tracked by digest in SOURCE_SNAPSHOT.md until a normal large-file Git synchronization is performed.

Read AGENTS.md before development and DEVELOPMENT_HANDOFF.md before continuing work from another chat or environment.

## Build

Run scripts/build_release.py. The default output directory is dist.

## Repository

https://github.com/TechSavage1989/YDO-Deck-Studio


## Recovered native baseline

The original native Go source for the rc189 application shell was not recovered. The rc236 build process patches the maintained browser source into the verified rc189 baseline executable. The baseline executable itself is intentionally not stored in this initial Git source import; verify any local copy against base/BASELINE_SHA256.txt before building. The complete rc236 source package delivered with the release contains the recovered baseline used for reproducible local builds.
