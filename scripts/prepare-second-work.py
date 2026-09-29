from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image


WORKSPACE = Path(r"D:\codex work")
SOURCE = WORKSPACE / "ip-portfolio-site" / "incoming" / "second-work"
DESTINATION = WORKSPACE / "ip-portfolio-site-live" / "dist" / "assets" / "satisfy"
MAX_WIDTH = 1440
MAX_SLICE_HEIGHT = 2400


IMAGE_SOURCES = [
    *(SOURCE / "batch-01" / f"image-{number:02d}.png" for number in range(1, 13)),
    SOURCE / "batch-02" / "image-13.png",
    SOURCE / "batch-02" / "image-14.png",
    SOURCE / "batch-02" / "image-15-project-summary.png",
]

VIDEO_SOURCES = {
    "satisfy-video-01.mp4": (SOURCE / "batch-01" / "video-01.mp4", False),
    "satisfy-video-02.mp4": (SOURCE / "batch-01" / "video-02.mp4", False),
    "satisfy-video-03.mp4": (SOURCE / "batch-01" / "video-03.mp4", False),
    "satisfy-video-total.mp4": (SOURCE / "batch-02" / "video-total.mp4", True),
}


def prepare_image(source: Path, image_number: int) -> list[dict[str, object]]:
    with Image.open(source) as opened:
        image = opened.convert("RGB")

    if image.width > MAX_WIDTH:
        target_height = round(image.height * MAX_WIDTH / image.width)
        image = image.resize((MAX_WIDTH, target_height), Image.Resampling.LANCZOS)

    segments: list[dict[str, object]] = []
    segment_number = 1
    for top in range(0, image.height, MAX_SLICE_HEIGHT):
        bottom = min(top + MAX_SLICE_HEIGHT, image.height)
        segment = image.crop((0, top, image.width, bottom))
        filename = f"satisfy-{image_number:02d}-s{segment_number:02d}.webp"
        target = DESTINATION / filename
        segment.save(target, "WEBP", quality=90, method=6)
        segments.append(
            {
                "file": filename,
                "width": segment.width,
                "height": segment.height,
            }
        )
        segment_number += 1

    return segments


def main() -> None:
    DESTINATION.mkdir(parents=True, exist_ok=True)

    for existing in DESTINATION.iterdir():
        if existing.is_file():
            existing.unlink()

    images: dict[str, list[dict[str, object]]] = {}
    for image_number, source in enumerate(IMAGE_SOURCES, start=1):
        if not source.exists():
            raise FileNotFoundError(source)
        images[f"image-{image_number:02d}"] = prepare_image(source, image_number)

    videos: dict[str, dict[str, object]] = {}
    for filename, (source, optimize) in VIDEO_SOURCES.items():
        if not source.exists():
            raise FileNotFoundError(source)
        target = DESTINATION / filename
        if optimize:
            ffmpeg = shutil.which("ffmpeg")
            if not ffmpeg:
                raise RuntimeError("ffmpeg is required to optimize the total project video")
            subprocess.run(
                [
                    ffmpeg,
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(source),
                    "-c:v",
                    "libx264",
                    "-preset",
                    "medium",
                    "-crf",
                    "26",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    "-movflags",
                    "+faststart",
                    str(target),
                ],
                check=True,
            )
        else:
            shutil.copy2(source, target)
        videos[filename] = {"file": filename, "bytes": target.stat().st_size}

    manifest = {"images": images, "videos": videos}
    (DESTINATION / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
