#!/usr/bin/env python3
"""Verify that a linked Windows launcher contains every image from its ICO.

This reads the finished PE resource directory. It does not modify the executable
or infer icon presence from embedded payload bytes.
"""
from __future__ import annotations

import argparse
import struct
from pathlib import Path


def resources(exe: bytes) -> dict[tuple[int, ...], bytes]:
    def unpack(fmt: str, offset: int):
        if offset < 0 or offset + struct.calcsize(fmt) > len(exe):
            raise ValueError("Truncated PE structure")
        return struct.unpack_from(fmt, exe, offset)

    if exe[:2] != b"MZ":
        raise ValueError("Not a Windows executable")
    pe, = unpack("<I", 60)
    if exe[pe:pe + 4] != b"PE\0\0":
        raise ValueError("Missing PE signature")
    machine, count = unpack("<HH", pe + 4)
    optional = pe + 24
    optional_size, = unpack("<H", pe + 20)
    if machine != 0x8664 or unpack("<H", optional)[0] != 0x20B:
        raise ValueError("Expected a Windows amd64 PE32+ executable")
    if unpack("<H", optional + 68)[0] != 2:
        raise ValueError("Expected the Windows GUI subsystem")
    rva, size = unpack("<II", optional + 128)
    if not rva or not size:
        raise ValueError("Executable has no Windows resource directory")

    sections = []
    for i in range(count):
        virtual_size, address, raw_size, file_offset = unpack(
            "<IIII", optional + optional_size + 40 * i + 8)
        sections.append((address, virtual_size, raw_size, file_offset))

    def file_position(address: int, length: int) -> int:
        for va, virtual_size, raw_size, offset in sections:
            delta = address - va
            if 0 <= delta and delta + length <= min(virtual_size, raw_size):
                if offset + delta + length > len(exe):
                    break
                return offset + delta
        raise ValueError("Resource points outside PE section data")

    root = file_position(rva, size)
    result = {}

    def resource_position(offset: int, length: int) -> int:
        if offset < 0 or offset + length > size:
            raise ValueError("Resource directory entry is out of bounds")
        return root + offset

    def walk(offset: int, path: tuple[int, ...]):
        if len(path) > 2:
            raise ValueError("Unexpected resource directory depth")
        directory = resource_position(offset, 16)
        named, ids = unpack("<HH", directory + 12)
        if named:
            raise ValueError("Expected numeric icon resources")
        resource_position(offset + 16, ids * 8)
        for i in range(ids):
            name, target = unpack("<II", directory + 16 + 8 * i)
            key = path + (name,)
            if target & 0x80000000:
                walk(target & 0x7FFFFFFF, key)
            else:
                if len(key) != 3 or key in result:
                    raise ValueError("Unexpected resource leaf")
                address, length, _, _ = unpack(
                    "<IIII", resource_position(target, 16))
                start = file_position(address, length)
                result[key] = exe[start:start + length]

    walk(0, ())
    return result


def validate(executable: Path, icon: Path) -> list[int]:
    ico = icon.read_bytes()
    reserved, kind, count = struct.unpack_from("<HHH", ico)
    if reserved or kind != 1 or not count or len(ico) < 6 + 16 * count:
        raise ValueError("Invalid source ICO directory")
    entries = [ico[6 + 16 * i:22 + 16 * i] for i in range(count)]
    linked = resources(executable.read_bytes())
    groups = sorted((key, data) for key, data in linked.items()
                    if key[0] == 14)
    if not groups or groups[0][0][1] != 1:
        raise ValueError("Missing primary application icon group")
    dimensions = []
    for (_, _, language), group in groups:
        if group[:6] != ico[:6] or len(group) != 6 + 14 * count:
            raise ValueError("Linked icon group does not match source ICO")
        for i, entry in enumerate(entries):
            group_entry = group[6 + 14 * i:20 + 14 * i]
            image_id, = struct.unpack_from("<H", group_entry, 12)
            length, offset = struct.unpack_from("<II", entry, 8)
            if offset < 6 + 16 * count or offset + length > len(ico):
                raise ValueError("Source ICO image is out of bounds")
            expected = bytearray(entry[:12])
            # The preserved PNG ICO uses zero planes. Windows group resources
            # use one plane, as in the recovered native application's icon.
            if struct.unpack_from("<H", expected, 4)[0] == 0:
                struct.pack_into("<H", expected, 4, 1)
            if group_entry[:12] != expected:
                raise ValueError("Linked icon dimensions or metadata differ")
            if linked.get((3, image_id, language)) != ico[offset:offset + length]:
                raise ValueError("Linked icon image differs from source ICO")
    for entry in entries:
        dimensions.append(entry[0] or 256)
    return dimensions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("executable", type=Path)
    parser.add_argument("icon", type=Path)
    args = parser.parse_args()
    try:
        dimensions = validate(args.executable, args.icon)
    except (ValueError, struct.error) as error:
        raise SystemExit(f"Windows icon validation failed: {error}")
    print("PASS - linked Windows icon matches source ICO at sizes "
          + ", ".join(map(str, dimensions)))


if __name__ == "__main__":
    main()
