"""Makes the site's heavy images light (audit phase 2, Nov 2026).

Icons -> WebP at most 256 px (they show at 64-128 px), wallpapers and the
ball's textures -> WebP at full size. Writes next to each original; the
originals are moved out by hand once the site points at the WebPs.

    python3 scripts/optimize-images.py
"""
import glob
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public')


def webp(src, max_side=None, quality=82):
    im = Image.open(src)
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if max_side and max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    out = os.path.splitext(src)[0] + '.webp'
    im.save(out, 'WEBP', quality=quality, method=6)
    print(f'{os.path.relpath(src, ROOT)}: {os.path.getsize(src) // 1024} KB -> {os.path.getsize(out) // 1024} KB')


for f in glob.glob(f'{ROOT}/assets/icons/**/*.png', recursive=True) + [f'{ROOT}/icons/desktop-folder.png']:
    webp(f, max_side=256, quality=86)
for f in glob.glob(f'{ROOT}/assets/backgrounds/*.jpg'):
    webp(f, quality=92)  # smooth gradients band below ~90
webp(f'{ROOT}/assets/hero/art/ball-color.jpg', quality=86)
webp(f'{ROOT}/assets/hero/art/ball-normal.jpg', quality=92)
