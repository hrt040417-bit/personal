from __future__ import annotations

import argparse
import json
from pathlib import Path

import pymupdf
from PIL import Image


def render(pdf_path: Path, output_dir: Path, segment_height: int) -> list[dict[str, int | str]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    document = pymupdf.open(pdf_path)
    manifest: list[dict[str, int | str]] = []

    for page_index, page in enumerate(document):
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1, 1), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        segment_count = (image.height + segment_height - 1) // segment_height

        for segment_index in range(segment_count):
            top = segment_index * segment_height
            bottom = min(image.height, top + segment_height)
            segment = image.crop((0, top, image.width, bottom))
            filename = f"ip-p{page_index + 1:02d}-s{segment_index + 1:02d}.webp"
            segment.save(
                output_dir / filename,
                "WEBP",
                quality=93,
                method=6,
            )
            manifest.append(
                {
                    "file": filename,
                    "width": segment.width,
                    "height": segment.height,
                    "page": page_index + 1,
                    "segment": segment_index + 1,
                }
            )

    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--segment-height", type=int, default=2400)
    args = parser.parse_args()
    manifest = render(args.pdf, args.output, args.segment_height)
    print(json.dumps({"images": len(manifest)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
