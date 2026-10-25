# Recovered Source Snapshots

## Current release candidate

Version: 3.0.0-alpha.221-duelcore.1-rc241

Complete source asset: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc241_Source_Chat.zip

Release tag: v3.0.0-alpha.221-duelcore.1-rc241

Verify the source asset against CHECKSUMS_SHA256_alpha221_duelcore1_rc241.txt attached to that release. The Source ZIP includes maintained browser code, dependencies, artwork, tests, launcher/updater, build tools, documentation, and the recovered native baseline.

Git maintains the changed application entry points and launcher/updater source. Until all unchanged dependencies and binary assets have been synchronized into Git, use the complete Source ZIP when preparing a build. Do not reconstruct missing browser files from memory or older revisions.

## Verified parent snapshot

RC241 continues from the published rc240 source asset:

- File: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc240_Source_Chat.zip
- SHA-256: 499e37e2a1b5a79b3243cef1177487c9ec89824ff9fba72aace983c9384040ea
- Git parent: bfdd322ea9babad795698f3262cf654451ba9727
- Recovered native baseline SHA-256: d1a91e2c53d9bb18472da91b28c5b92069dedfd70d8b2b41dc265c392936febf

Earlier published artifacts remain unchanged. RC241 makes the public executable filename YGODeckStudio.exe across standalone downloads, the updater manifest, and portable packages. Existing installed paths are preserved during updates. RC240's desktop icon fix was confirmed by the owner and remains linked at compilation. The rc238 Download-button interaction fix is preserved.
