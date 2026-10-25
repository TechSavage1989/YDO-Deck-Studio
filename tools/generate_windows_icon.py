#!/usr/bin/env python3
"""Regenerate the checked-in launcher icon object with a pinned resource tool.

Ordinary builds use the checked-in object and need no resource-tool download.
Run this after changing web/assets/app_icon.ico, then build and validate the PE.
"""
from pathlib import Path
import hashlib
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    data = bytearray((ROOT / "web/assets/app_icon.ico").read_bytes())
    reserved, kind, count = struct.unpack_from("<HHH", data)
    if reserved or kind != 1 or not count or len(data) < 6 + 16 * count:
        raise SystemExit("Invalid application ICO")
    # Preserve the artwork exactly. Normalize only the PNG directory's plane
    # metadata to the one-plane group descriptor used by the original app.
    for i in range(count):
        offset = 6 + 16 * i + 4
        if struct.unpack_from("<H", data, offset)[0] == 0:
            struct.pack_into("<H", data, offset, 1)
    output = ROOT / "launcher/rsrc_windows_amd64.syso"
    with tempfile.TemporaryDirectory(prefix="ygo-icon-") as temporary:
        icon = Path(temporary) / "app_icon.ico"
        icon.write_bytes(data)
        subprocess.run([
            "go", "run", "github.com/akavel/rsrc@v0.10.2", "-arch", "amd64",
            "-ico", str(icon), "-o", str(output)
        ], cwd=ROOT, check=True)
    print(f"Generated {output.name}: {hashlib.sha256(output.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
