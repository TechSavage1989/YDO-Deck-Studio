# Recovered Source Snapshots

## Current release candidate

Version: 3.0.0-alpha.221-duelcore.1-rc237

Complete source asset: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc237_Source_Chat.zip

Release tag: v3.0.0-alpha.221-duelcore.1-rc237

Verify the source asset against CHECKSUMS_SHA256_alpha221_duelcore1_rc237.txt attached to that release. The Source ZIP includes maintained browser code, dependencies, artwork, tests, launcher/updater, build tools, documentation, and the recovered native baseline.

Git maintains the changed application entry points and launcher/updater source. Until all unchanged dependencies and binary assets have been synchronized into Git, use the complete Source ZIP when preparing a build. Do not reconstruct missing browser files from memory or older revisions.

## Verified parent snapshot

RC237 continues from the published rc236 source asset:

- File: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc236_Source_Chat.zip
- SHA-256: 868e11a581aaaf962eb6e61505d8a836d78518099446962321da2f1e860f64be
- Git parent: a7bf25427186121c0702839042592fb89ffa4279
- Recovered native baseline SHA-256: d1a91e2c53d9bb18472da91b28c5b92069dedfd70d8b2b41dc265c392936febf

The parent source ZIP supplies the verified launcher command quoting and release-note newline parsing restored in rc237 after errors were found in the initial Git text import. The published rc236 artifacts are unchanged.
