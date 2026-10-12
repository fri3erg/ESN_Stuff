"""Turn any suspect photo into a small black & white 3:4 mugshot for the site.

Usage (from crime-night/):
    python tools/prepare_photo.py "path/to/WhatsApp Image.jpeg" sissi [x y]

Optional x y (0..1, default 0.5 0.4) pick where the 3:4 crop is centred,
e.g. 0.3 0.5 keeps more of the left side, 0.5 0.7 crops lower.

Writes img/suspects/sissi.jpg (600x800, greyscale, ~50 KB). Then set
photo: 'img/suspects/sissi.jpg' for that suspect in data/suspects.js.
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

W, H = 600, 800  # 3:4 portrait, like a police mugshot

def prepare(src: Path, name: str, centering=(0.5, 0.4)) -> Path:
    img = ImageOps.exif_transpose(Image.open(src))
    img = ImageOps.fit(img, (W, H), method=Image.LANCZOS, centering=centering)
    img = ImageOps.autocontrast(img.convert('L'), cutoff=1)
    out = Path(__file__).resolve().parent.parent / 'img' / 'suspects' / f'{name.lower()}.jpg'
    img.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
    return out

if __name__ == '__main__':
    if len(sys.argv) not in (3, 5):
        sys.exit(__doc__)
    centering = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) == 5 else (0.5, 0.4)
    out = prepare(Path(sys.argv[1]), sys.argv[2], centering)
    print(f'{out} ({out.stat().st_size // 1024} KB)')
