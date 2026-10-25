package payload

import _ "embed"

// Core is the recovered native YGO Deck Studio core with the current browser assets.
//
//go:embed YGODeckStudioCore.exe
var Core []byte
