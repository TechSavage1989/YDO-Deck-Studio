#!/usr/bin/env python3
"""Patch the verified rc236 browser assets into the exact rc189 Go executable.

This script intentionally supports only the supplied rc189 baseline. It verifies the
baseline SHA-256 before modifying the Go embed.FS payload, updates the embedded file
lengths and compiler hashes, and leaves all native code and PE resources unchanged.
"""
from __future__ import annotations

import argparse
import hashlib
import struct
import sys
from dataclasses import dataclass
from pathlib import Path

BASE_SHA256 = "d1a91e2c53d9bb18472da91b28c5b92069dedfd70d8b2b41dc265c392936febf"
EMBED_TABLE_VA = 0xD6A578
EMBED_ENTRY_COUNT = 87
EMBED_ENTRY_SIZE = 48
NATIVE_VERSION_OLD = b"3.0.0-alpha.221-duelcore.1-rc189"
NATIVE_VERSION_NEW = b"3.0.0-alpha.221-duelcore.1-rc236"
PATCH_FILES = (
    "web/index.html",
    "web/styles.css",
    "web/js/app.js",
    "web/js/duel-core.js",
)

@dataclass(frozen=True)
class Section:
    name: str
    virtual_address: int
    virtual_size: int
    raw_offset: int
    raw_size: int

class PEImage:
    def __init__(self, data: bytearray) -> None:
        self.data = data
        if data[:2] != b"MZ":
            raise ValueError("Input is not a PE executable.")
        pe_offset = struct.unpack_from("<I", data, 0x3C)[0]
        if data[pe_offset:pe_offset + 4] != b"PE\x00\x00":
            raise ValueError("Input has an invalid PE signature.")
        coff_offset = pe_offset + 4
        number_of_sections = struct.unpack_from("<H", data, coff_offset + 2)[0]
        optional_size = struct.unpack_from("<H", data, coff_offset + 16)[0]
        optional_offset = coff_offset + 20
        magic = struct.unpack_from("<H", data, optional_offset)[0]
        if magic != 0x20B:
            raise ValueError("Expected a PE32+ executable.")
        self.image_base = struct.unpack_from("<Q", data, optional_offset + 24)[0]
        section_offset = optional_offset + optional_size
        sections: list[Section] = []
        for index in range(number_of_sections):
            offset = section_offset + index * 40
            raw_name = bytes(data[offset:offset + 8]).split(b"\x00", 1)[0]
            name = raw_name.decode("ascii", errors="replace")
            virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from("<IIII", data, offset + 8)
            sections.append(Section(name, virtual_address, virtual_size, raw_offset, raw_size))
        self.sections = sections

    def va_to_offset(self, va: int) -> int:
        rva = va - self.image_base
        for section in self.sections:
            extent = max(section.virtual_size, section.raw_size)
            if section.virtual_address <= rva < section.virtual_address + extent:
                delta = rva - section.virtual_address
                if delta >= section.raw_size:
                    raise ValueError(f"Virtual address {va:#x} is outside section raw data.")
                return section.raw_offset + delta
        raise ValueError(f"Virtual address {va:#x} is not mapped by the PE sections.")

    def read_go_string(self, pointer: int, length: int) -> str:
        if not pointer and not length:
            return ""
        offset = self.va_to_offset(pointer)
        return bytes(self.data[offset:offset + length]).decode("utf-8")

@dataclass
class EmbeddedFile:
    name: str
    entry_offset: int
    data_va: int
    original_size: int
    original_hash: bytes

def compiler_embed_hash(data: bytes) -> bytes:
    if len(data) > 1024:
        return hashlib.sha256(b"\x01" + data).digest()[:16]
    digest = bytearray(hashlib.sha256(data).digest())
    digest[0] ^= 1
    return bytes(digest[:16])

def read_embed_table(image: PEImage) -> dict[str, EmbeddedFile]:
    table_offset = image.va_to_offset(EMBED_TABLE_VA)
    entries: dict[str, EmbeddedFile] = {}
    for index in range(EMBED_ENTRY_COUNT):
        entry_offset = table_offset + index * EMBED_ENTRY_SIZE
        name_pointer, name_length, data_pointer, data_length = struct.unpack_from("<QQQQ", image.data, entry_offset)
        name = image.read_go_string(name_pointer, name_length)
        stored_hash = bytes(image.data[entry_offset + 32:entry_offset + 48])
        if not name:
            raise ValueError(f"Embedded file entry {index} has no name.")
        if name in entries:
            raise ValueError(f"Duplicate embedded file entry: {name}")
        entries[name] = EmbeddedFile(name, entry_offset, data_pointer, data_length, stored_hash)
    return entries

def source_path_for(web_root: Path, embedded_name: str) -> Path:
    return web_root / embedded_name.removeprefix("web/")

def compact_css_text(text: str) -> str:
    out: list[str] = []
    index = 0
    quote = None
    escaped = False
    while index < len(text):
        char = text[index]
        if quote:
            out.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue
        if char in ("'", '"'):
            quote = char
            out.append(char)
            index += 1
            continue
        if char == "/" and index + 1 < len(text) and text[index + 1] == "*":
            end = text.find("*/", index + 2)
            if end < 0:
                raise ValueError("Unterminated CSS comment.")
            index = end + 2
            continue
        if char.isspace():
            end = index + 1
            while end < len(text) and text[end].isspace():
                end += 1
            next_char = text[end] if end < len(text) else ""
            previous = out[-1] if out else ""
            if previous and next_char and previous not in "{}:;,>" and next_char not in "{}:;,>":
                if previous != " ":
                    out.append(" ")
            index = end
            continue
        if char in "{}:;,>":
            if out and out[-1] == " ":
                out.pop()
            out.append(char)
            index += 1
            while index < len(text) and text[index].isspace():
                index += 1
            continue
        out.append(char)
        index += 1
    return "".join(out)

def replacement_bytes(path: Path, embedded_name: str) -> bytes:
    data = path.read_bytes()
    if embedded_name == "web/styles.css":
        return compact_css_text(data.decode("utf-8")).encode("utf-8")
    if embedded_name not in ("web/js/app.js", "web/js/duel-core.js"):
        return data
    text = data.decode("utf-8")
    for comment in (
        " // Blue-Eyes White Dragon: inert Level 8 normal monster.",
        " // Alexandrite Dragon: deterministic normal-summon smoke test.",
        " // Pot of Greed: deterministic script/chain/draw smoke test.",
        " // Unknown set monster: legal but uncertain.",
    ):
        text = text.replace(comment, "")
    lines: list[str] = []
    in_block_comment = False
    for raw in text.splitlines():
        line = raw.lstrip(" \t")
        if not line:
            continue
        if in_block_comment:
            if "*/" in line:
                in_block_comment = False
            continue
        if line.startswith("//"):
            continue
        if line.startswith("/*"):
            if "*/" not in line:
                in_block_comment = True
            continue
        lines.append(line)
    chunks: list[str] = []
    for index, line in enumerate(lines):
        chunks.append(line)
        if index < len(lines) - 1 and not line.rstrip().endswith((";", "{", "}", ",")):
            chunks.append("\n")
    chunks.append("\n")
    return "".join(chunks).encode("utf-8")

def verify_original_entry(image: PEImage, entry: EmbeddedFile) -> None:
    if entry.original_size == 0:
        raise ValueError(f"Cannot patch directory entry {entry.name}.")
    data_offset = image.va_to_offset(entry.data_va)
    original = bytes(image.data[data_offset:data_offset + entry.original_size])
    calculated = compiler_embed_hash(original)
    if calculated != entry.original_hash:
        raise ValueError(f"Embedded hash verification failed for {entry.name}: stored {entry.original_hash.hex()}, calculated {calculated.hex()}.")

def patch_file(image: PEImage, entry: EmbeddedFile, replacement: bytes) -> None:
    verify_original_entry(image, entry)
    if len(replacement) > entry.original_size:
        raise ValueError(f"Replacement {entry.name} is {len(replacement)} bytes, which exceeds the baseline allocation of {entry.original_size} bytes.")
    data_offset = image.va_to_offset(entry.data_va)
    image.data[data_offset:data_offset + len(replacement)] = replacement
    tail = entry.original_size - len(replacement)
    if tail:
        image.data[data_offset + len(replacement):data_offset + entry.original_size] = b"\x00" * tail
    struct.pack_into("<Q", image.data, entry.entry_offset + 24, len(replacement))
    image.data[entry.entry_offset + 32:entry.entry_offset + 48] = compiler_embed_hash(replacement)

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_exe", type=Path, help="Exact rc189 baseline executable")
    parser.add_argument("web_root", type=Path, help="Patched web source root")
    parser.add_argument("output_exe", type=Path, help="Output rc236 executable")
    args = parser.parse_args()
    base_bytes = args.base_exe.read_bytes()
    actual_sha = hashlib.sha256(base_bytes).hexdigest()
    if actual_sha != BASE_SHA256:
        raise SystemExit("Baseline executable does not match the supported rc189 file.\n" f"Expected: {BASE_SHA256}\nActual:   {actual_sha}")
    image = PEImage(bytearray(base_bytes))
    entries = read_embed_table(image)
    missing = [name for name in PATCH_FILES if name not in entries]
    if missing:
        raise SystemExit("Missing embedded entries: " + ", ".join(missing))
    changed: list[tuple[str, int, int]] = []
    for name in PATCH_FILES:
        path = source_path_for(args.web_root, name)
        if not path.is_file():
            raise SystemExit(f"Replacement source file is missing: {path}")
        replacement = replacement_bytes(path, name)
        entry = entries[name]
        patch_file(image, entry, replacement)
        changed.append((name, entry.original_size, len(replacement)))
    remaining_native_versions = image.data.count(NATIVE_VERSION_OLD)
    if remaining_native_versions != 1:
        raise ValueError(f"Expected exactly one native rc189 version constant after embedded asset replacement, found {remaining_native_versions}.")
    native_offset = image.data.find(NATIVE_VERSION_OLD)
    image.data[native_offset:native_offset + len(NATIVE_VERSION_OLD)] = NATIVE_VERSION_NEW
    args.output_exe.parent.mkdir(parents=True, exist_ok=True)
    args.output_exe.write_bytes(image.data)
    output_sha = hashlib.sha256(image.data).hexdigest()
    print(f"Created: {args.output_exe}")
    print(f"SHA-256: {output_sha}")
    for name, old_size, new_size in changed:
        print(f"{name}: {old_size} bytes -> {new_size} bytes")
    print(f"Native version constant: rc189 -> rc236 at file offset {native_offset:#x}")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, struct.error) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
