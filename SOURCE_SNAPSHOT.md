# Recovered Source Snapshots

## Current release candidate

Version: 3.0.0-alpha.221-duelcore.1-rc240

Complete source asset: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc240_Source_Chat.zip

Release tag: v3.0.0-alpha.221-duelcore.1-rc240

Verify the source asset against CHECKSUMS_SHA256_alpha221_duelcore1_rc240.txt attached to that release. The Source ZIP includes maintained browser code, dependencies, artwork, tests, launcher/updater, build tools, documentation, and the recovered native baseline.

Git maintains the changed application entry points and launcher/updater source. Until all unchanged dependencies and binary assets have been synchronized into Git, use the complete Source ZIP when preparing a build. Do not reconstruct missing browser files from memory or older revisions.

## Verified parent snapshot

RC240 continues from the published rc239 source asset:

- File: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc239_Source_Chat.zip
- SHA-256: 1349f80784705c1e62155ec4a9a15073e29dbdd910425304385081b7809d7f1c
- Git parent: 749445792005df0bfb1d0e576e1b78229ae080ff
- Recovered native baseline SHA-256: d1a91e2c53d9bb18472da91b28c5b92069dedfd70d8b2b41dc265c392936febf

Earlier published artifacts remain unchanged. RC240 restores the Windows icon by linking a checked-in resource object at launcher build time. All original icon image bytes are preserved. The release builder independently checks the finished PE icon resources. The rc238 Download-button interaction fix is preserved.
