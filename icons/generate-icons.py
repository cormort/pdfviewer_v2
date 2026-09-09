#!/usr/bin/env python3
"""Regenerate the app icons.

Run from the repository root:  python3 icons/generate-icons.py

The icon is a book: teal cover, darker bound edge on the left, page block on
the right, with "PDF" set as hollow outlined letters over a solid shadow.

Two variants are produced. The plain one carries its own rounded corners. The
maskable one runs full bleed with square corners, because the launcher applies
its own shape, and keeps the lettering smaller so nothing important falls
outside the safe zone a circular crop leaves behind.

Every part is drawn as a plain rectangle and the rounded corners come from one
alpha mask applied at the end. Rounding each band on its own gave three arcs
that did not meet, leaving transparent notches along the top and bottom edges.
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
    # The cover fills the whole square; the corners are cut at the end.
    img = Image.new('RGBA', (S, S), TEAL)
    d = ImageDraw.Draw(img)

    # letter is the share of the cover the lettering may occupy, measured as
    # real ink: glyph box plus the stroke on both sides plus the shadow offset.
    if maskable:
        radius, letter = 0, 0.62
    else:
        radius, letter = S * 0.22, 0.86

    x0, y0, x1, y1 = 0, 0, S, S
    w = x1 - x0

    # Page block along the fore edge. The cover wraps past it on every side:
    # flush to the edge the cream pages vanish into a light background, and
    # anywhere inside the corner radius the rounded silhouette slices a wedge
    # out of them. Hence a vertical inset larger than that radius, and soft
    # corners of its own so the block reads as deliberate.
    edge = w * 0.035
    pages = w * 0.11
    top = w * 0.13
    d.rounded_rectangle([x1 - pages, y0 + top, x1 - edge, y1 - top],
                        radius=w * 0.022, fill=PAGE)
    for i in range(1, 4):
        lx = x1 - pages + (pages - edge) * i / 4
        d.line([(lx, y0 + top + (y1 - y0) * 0.05), (lx, y1 - top - (y1 - y0) * 0.05)],
               fill=PAGE_LINE, width=max(1, int(S * 0.004)))

    # spine along the bound edge
    spine = w * 0.13
    d.rectangle([x0, y0, x0 + spine, y1], fill=SPINE)
    d.line([(x0 + spine, y0), (x0 + spine, y1)], fill=SHADOW, width=max(1, int(S * 0.006)))

    # "PDF" across the cover. The size is solved from the ink the lettering
    # actually lays down, not from the glyph box alone: sizing on the glyphs
    # let the stroke and the shadow spill over the seam onto the page block.
    cover_l, cover_r = x0 + spine, x1 - pages
    cover_w = cover_r - cover_l
    off = S * 0.024
    stroke = max(1, int(S * 0.014))

    available = cover_w * letter - off - 2 * stroke
    guess = int(available / 1.9)
    for _ in range(6):
        font = ImageFont.truetype(FONT, max(8, guess))
        l, t, r, b = d.textbbox((0, 0), 'PDF', font=font)
        if abs((r - l) - available) <= available * 0.01:
            break
        guess = int(guess * available / max(r - l, 1))

    l, t, r, b = d.textbbox((0, 0), 'PDF', font=font)
    ink_w = (r - l) + off + 2 * stroke
    ink_h = (b - t) + off + 2 * stroke
    tx = cover_l + (cover_w - ink_w) / 2 + stroke - l
    ty = y0 + ((y1 - y0) - ink_h) / 2 + stroke - t

    # Solid shadow first, then the letter filled with the cover colour, so only
    # the outward half of the white stroke shows. That is what makes the letter
    # read as hollow with the shadow peeking out on two sides.
    d.text((tx + off, ty + off), 'PDF', font=font, fill=SHADOW,
           stroke_width=stroke, stroke_fill=SHADOW)
    d.text((tx, ty), 'PDF', font=font, fill=TEAL,
           stroke_width=stroke, stroke_fill=WHITE)

    # One silhouette for the whole book, so the bands cannot disagree about
    # where the corner is.
    if radius:
        mask = Image.new('L', (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=255)
        img.putalpha(mask)

    return img.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    for size in (192, 512):
        book_icon(size).save(f'icons/icon-{size}.png')
        book_icon(size, maskable=True).save(f'icons/icon-{size}-maskable.png')
    book_icon(180).save('icons/apple-touch-icon.png')
    print('icons written to icons/')
