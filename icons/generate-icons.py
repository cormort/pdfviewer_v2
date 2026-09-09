#!/usr/bin/env python3
"""Regenerate the app icons.

Run from the repository root:  python3 icons/generate-icons.py

The icon is a book: teal cover, darker bound edge on the left, page block on
the right, with "PDF" set as hollow outlined letters over a solid shadow.

Two variants are produced. The plain one carries its own rounded corners. The
maskable one runs full bleed with square corners, because the launcher applies
its own shape, and keeps the lettering smaller so nothing important falls
outside the safe zone a circular crop leaves behind.
"""
from PIL import Image, ImageDraw, ImageFont

TEAL      = (14, 124, 134, 255)    # --primary-color, the cover
SPINE     = (8, 84, 91, 255)       # the bound edge
SHADOW    = (5, 58, 63, 255)       # the drop shadow behind the letters
PAGE      = (251, 251, 249, 255)   # --bg-primary, the page block
PAGE_LINE = (214, 214, 208, 255)
WHITE     = (255, 255, 255, 255)

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def book_icon(size, maskable=False):
    S = size * 8                     # supersampled, downscaled at the end
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if maskable:
        radius, letter = 0, 0.33
    else:
        radius, letter = S * 0.22, 0.43

    x0, y0, x1, y1 = 0, 0, S, S
    w = x1 - x0

    # cover
    d.rounded_rectangle([x0, y0, x1 - 1, y1 - 1], radius=radius, fill=TEAL)

    # page block along the fore edge
    pages = w * 0.10
    d.rounded_rectangle([x1 - pages, y0, x1 - 1, y1 - 1], radius=radius, fill=PAGE)
    d.rectangle([x1 - pages, y0, x1 - pages * 0.45, y1], fill=PAGE)
    for i in range(1, 4):
        lx = x1 - pages + pages * i / 4
        d.line([(lx, y0 + (y1 - y0) * 0.08), (lx, y1 - (y1 - y0) * 0.08)],
               fill=PAGE_LINE, width=max(1, int(S * 0.004)))

    # spine along the bound edge
    spine = w * 0.13
    d.rounded_rectangle([x0, y0, x0 + spine, y1 - 1], radius=radius, fill=SPINE)
    d.rectangle([x0 + spine * 0.5, y0, x0 + spine, y1], fill=SPINE)
    d.line([(x0 + spine, y0), (x0 + spine, y1)], fill=SHADOW, width=max(1, int(S * 0.006)))

    # "PDF" across the cover
    cover_l, cover_r = x0 + spine, x1 - pages
    cover_w = cover_r - cover_l
    font = ImageFont.truetype(FONT, int(cover_w * letter))
    l, t, r, b = d.textbbox((0, 0), 'PDF', font=font)
    tx = cover_l + (cover_w - (r - l)) / 2 - l
    ty = y0 + ((y1 - y0) - (b - t)) / 2 - t
    off = S * 0.024
    stroke = max(1, int(S * 0.014))

    # Solid shadow first, then the letter filled with the cover colour, so only
    # the outward half of the white stroke shows. That is what makes the letter
    # read as hollow with the shadow peeking out on two sides.
    d.text((tx + off, ty + off), 'PDF', font=font, fill=SHADOW,
           stroke_width=stroke, stroke_fill=SHADOW)
    d.text((tx, ty), 'PDF', font=font, fill=TEAL,
           stroke_width=stroke, stroke_fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    for size in (192, 512):
        book_icon(size).save(f'icons/icon-{size}.png')
        book_icon(size, maskable=True).save(f'icons/icon-{size}-maskable.png')
    book_icon(180).save('icons/apple-touch-icon.png')
    print('icons written to icons/')
