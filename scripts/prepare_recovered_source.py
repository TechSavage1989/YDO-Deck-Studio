"""Combine the verified published source snapshot with this exact Git checkout.

Writes a new directory only; never modifies the published archive or current tree.
"""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_SHA256 = '4dd96f71fdef5c91a55ff2fa0b259f15d8286dbfee6ee6b29af07f962cf3016e'
BASELINE_SHA256 = 'd1a91e2c53d9bb18472da91b28c5b92069dedfd70d8b2b41dc265c392936febf'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if hashlib.sha256(args.snapshot.read_bytes()).hexdigest() != SNAPSHOT_SHA256:
        raise SystemExit('Published rc241 Source ZIP SHA-256 mismatch')
    out = args.out.resolve()
    if out.exists():
        raise SystemExit('Output must be a new directory')
    # Validate every archive path before writing anything.
    with zipfile.ZipFile(args.snapshot) as archive:
        entries = []
        for entry in archive.infolist():
            parts = PurePosixPath(entry.filename).parts
            if not parts or PurePosixPath(entry.filename).is_absolute() or '..' in parts or '\\' in entry.filename:
                raise SystemExit('Unsafe archive path')
            if entry.is_dir() or len(parts) == 1:
                continue
            rel = Path(*parts[1:])
            if len(rel.parts) == 1:
                if rel.name.startswith('CHANGELOG_rc'):
                    rel = Path('docs/releases') / rel
                elif rel.name.startswith('DUELCORE_VALIDATION_'):
                    rel = Path('docs/validation') / rel
                elif rel.name.startswith('BUILD_RC') and rel.name != 'BUILD_RC241.cmd':
                    rel = Path('scripts/history') / rel
                elif rel.name in {'SOURCE_SNAPSHOT.md', 'README_BUILD.txt'}:
                    rel = Path('docs') / rel
            entries.append((entry, rel))
        for entry, rel in entries:
            target = out / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(entry))
    # Git's tracked inventory, not arbitrary local caches or build outputs.
    paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    for name in filter(None, paths):
        source = ROOT / name
        if not source.is_file():
            continue
        target = out / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    baseline = out / 'base/YGO_Deck_Studio_3_v3.0.0-alpha.221-duelcore.1-rc189_Base.exe'
    if hashlib.sha256(baseline.read_bytes()).hexdigest() != BASELINE_SHA256:
        raise SystemExit('Recovered native baseline SHA-256 mismatch')
    subprocess.run([sys.executable, str(out / 'scripts/check_layout.py')], check=True)
    print('Verified rc241 snapshot + current tracked source prepared in', out)

if __name__ == '__main__':
    main()
