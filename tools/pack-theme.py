#!/usr/bin/env python3
"""Zip shopify-theme so Shopify can upload it. The zip root is the theme."""

import pathlib
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
theme = root / "shopify-theme"
destination = root / "gadget-shelf-theme.zip"

with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(theme.rglob("*")):
        if path.is_file() and path.name != ".DS_Store":
            archive.write(path, path.relative_to(theme).as_posix())

print(destination)
