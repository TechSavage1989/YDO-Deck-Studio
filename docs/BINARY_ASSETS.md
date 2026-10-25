# Binary Assets and Recovered Baseline

The initial public Git source import is source-first. The automated GitHub write interface used for this import writes UTF-8 repository content and does not upload the recovered 15 MB native rc189 baseline executable.

## Required recovered baseline

The rc236 build patches maintained browser assets into:

base/YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc189_Base.exe

Validate any separately supplied copy against base/BASELINE_SHA256.txt before use. Do not substitute a different executable merely because its filename matches.

## Web binary assets

The complete rc236 source package also contains PNG, ICO, WEBP, and MP3 assets under web/assets. Those files are runtime/reference assets retained in the complete source package. The recovered baseline already embeds the browser assets required by the patching workflow; tools/patch_embedded_web.py replaces only the maintained embedded web files it explicitly validates.

Future repository synchronization should add binary assets through a normal Git clone/push or approved release-artifact workflow when available. Do not fabricate or regenerate visual/audio assets from similarly named files.
