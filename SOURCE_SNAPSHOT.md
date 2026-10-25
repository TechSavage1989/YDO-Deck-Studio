# Recovered Source Snapshots

## Current release candidate

Version: 3.0.0-alpha.221-duelcore.1-rc238

Complete source asset: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc238_Source_Chat.zip

Release tag: v3.0.0-alpha.221-duelcore.1-rc238

Verify the source asset against CHECKSUMS_SHA256_alpha221_duelcore1_rc238.txt attached to that release. The Source ZIP includes maintained browser code, dependencies, artwork, tests, launcher/updater, build tools, documentation, and the recovered native baseline.

Git maintains the changed application entry points and launcher/updater source. Until all unchanged dependencies and binary assets have been synchronized into Git, use the complete Source ZIP when preparing a build. Do not reconstruct missing browser files from memory or older revisions.

## Verified parent snapshot

RC238 continues from the published rc237 source asset:

- File: YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc237_Source_Chat.zip
- SHA-256: 6d8ef75857cafba0ae516fff6633f4f6b503665852745301ad1b8d24122de703
- Git parent: b49273ceff4d7df65deaf663174e7acb4b267f6f
- Recovered native baseline SHA-256: d1a91e2c53d9bb18472da91b28c5b92069dedfd70d8b2b41dc265c392936febf

The published rc236 and rc237 artifacts remain unchanged. RC238 fixes the mouse-click blocker in the update banner. Affected older builds can use keyboard Tab/Enter to activate Download once, or use the rc238 portable package for manual launcher replacement.
