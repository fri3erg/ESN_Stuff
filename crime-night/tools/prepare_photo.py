"""Turn any suspect photo into a small black & white 3:4 mugshot for the site.

Usage (from crime-night/):
    python tools/prepare_photo.py "path/to/WhatsApp Image.jpeg" sissi

Writes img/suspects/sissi.jpg (600x800, greyscale, ~50 KB). Then set
photo: 'img/suspects/sissi.jpg' for that suspect in data/suspects.js.
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

W, H = 600, 800  # 3:4 portrait, like a police mugshot

def prepare(src: Path, name: str) -> Path:
    img = ImageOps.exif_transpose(Image.open(src))
    img = ImageOps.fit(img, (W, H), method=Image.LANCZOS, centering=(0.5, 0.4))
    img = ImageOps.autocontrast(img.convert('L'), cutoff=1)
    out = Path(__file__).resolve().parent.parent / 'img' / 'suspects' / f'{name.lower()}.jpg'
    img.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
    return out

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    out = prepare(Path(sys.argv[1]), sys.argv[2])
    print(f'{out} ({out.stat().st_size // 1024} KB)')
