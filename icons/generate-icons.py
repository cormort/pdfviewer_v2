#!/usr/bin/env python3
"""Regenerate the app icons.

Run from the repository root:  python3 icons/generate-icons.py

A cream book stands on a teal tile, tilted a few degrees with a shadow behind
it. Drawn head on and flat, a closed book is just a rectangle, and earlier
versions of this icon read as an app tile with a stripe down one side. The
tilt, the shadow and the page block showing behind the cover are what make it
a book at a glance.

Book anatomy, from left to right: a square bound edge with a hinge line, the
cover, and the page stack peeking out along the rounded fore edge. "PDF" sits
on the cover as hollow outlined letters over a soft shadow.

Two variants. The plain one carries the tile's rounded corners. The maskable
one runs full bleed with square corners, because the launcher applies its own
shape, and holds the book well inside the safe zone a circular crop leaves.
"""
from PIL import Image, ImageDraw, ImageFont

TEAL      = (14, 124, 134, 255)    # --primary-color, the tile
DEEP      = (8, 84, 91, 255)       # the letter outline
DARK      = (5, 58, 63, 255)       # the shadow the book casts
CREAM     = (251, 251, 249, 255)   # --bg-primary, the cover
CREAM_DIM = (233, 231, 224, 255)   # the pages behind it, and the bound edge
LINE      = (206, 203, 194, 255)   # hinge line, page edges, letter shadow

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

TILT = -7                          # degrees; enough to read, not enough to wobble


def _fit_font(d, text, ink_width, offset, stroke):
    """Font size solved from the ink the lettering lays down, not the glyph box.

    Sizing on the glyphs alone let the stroke and the shadow spill past the
    cover onto the pages.
    """
    available = ink_width - offset - 2 * stroke
    guess = int(available / 1.9)
    for _ in range(6):
        font = ImageFont.truetype(FONT, max(8, guess))
        left, _, right, _ = d.textbbox((0, 0), text, font=font)
        if abs((right - left) - available) <= available * 0.01:
            break
        guess = int(guess * available / max(right - left, 1))
    return ImageFont.truetype(FONT, max(8, guess))


def _book(S, width, height):
    """The book itself, upright, on a transparent ground."""
    W, H = int(width), int(height)
    book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(book)

    # page stack, offset right and down so it shows past the cover
    d.rounded_rectangle([W * 0.10, H * 0.03, W * 0.99, H * 0.985],
                        radius=W * 0.06, fill=CREAM_DIM)

    # cover: square on the bound edge, rounded on the fore edge
    shape = Image.new('L', (W, H), 0)
    sd = ImageDraw.Draw(shape)
    sd.rounded_rectangle([0, 0, W * 0.94, H * 0.955], radius=W * 0.07, fill=255)
    sd.rectangle([0, 0, W * 0.16, H * 0.955], fill=255)

    cover = Image.new('RGBA', (W, H), CREAM)
    cd = ImageDraw.Draw(cover)
    cd.rectangle([0, 0, W * 0.15, H * 0.955], fill=CREAM_DIM)
    cd.line([(W * 0.15, 0), (W * 0.15, H * 0.955)], fill=LINE, width=max(1, int(S * 0.006)))
    cover.putalpha(shape)
    book.alpha_composite(cover)

    # title across the cover
    offset = S * 0.018
    stroke = max(1, int(S * 0.011))
    cover_l, cover_r = W * 0.15, W * 0.94
    font = _fit_font(d, 'PDF', (cover_r - cover_l) * 0.88, offset, stroke)
    l, t, r, b = d.textbbox((0, 0), 'PDF', font=font)
    ink_w = (r - l) + offset + 2 * stroke
    ink_h = (b - t) + offset + 2 * stroke
    tx = cover_l + ((cover_r - cover_l) - ink_w) / 2 + stroke - l
    ty = (H * 0.955 - ink_h) / 2 + stroke - t

    # Solid shadow first, then the letter filled with the cover colour, so only
    # the outward half of the stroke shows: a hollow letter with the shadow
    # peeking out on two sides.
    d.text((tx + offset, ty + offset), 'PDF', font=font, fill=LINE,
           stroke_width=stroke, stroke_fill=LINE)
    d.text((tx, ty), 'PDF', font=font, fill=CREAM,
           stroke_width=stroke, stroke_fill=DEEP)

    return book


def book_icon(size, maskable=False):
    S = size * 8                     # supersampled, downscaled at the end
    tile = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    shape = Image.new('L', (S, S), 0)
    if maskable:
        # the launcher supplies the shape
        ImageDraw.Draw(shape).rectangle([0, 0, S, S], fill=255)
        scale = 0.42                 # small enough to survive a circular crop
    else:
        ImageDraw.Draw(shape).rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22, fill=255)
        scale = 0.60
    ImageDraw.Draw(tile).bitmap((0, 0), shape, fill=TEAL)

    book = _book(S, S * scale, S * scale * 1.23)
    book = book.rotate(TILT, resample=Image.BICUBIC, expand=True)

    shadow = Image.new('RGBA', book.size, (0, 0, 0, 0))
    shadow.paste(DARK, (0, 0), book.split()[3])

    px, py = (S - book.width) // 2, (S - book.height) // 2
    tile.alpha_composite(shadow, (px + int(S * 0.020), py + int(S * 0.028)))
    tile.alpha_composite(book, (px, py))

    # Trim anything that reached past the tile, so the book cannot poke out of
    # the corners.
    tile.putalpha(Image.composite(tile.split()[3], Image.new('L', (S, S), 0), shape))

    return tile.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    for size in (192, 512):
        book_icon(size).save(f'icons/icon-{size}.png')
        book_icon(size, maskable=True).save(f'icons/icon-{size}-maskable.png')
    book_icon(180).save('icons/apple-touch-icon.png')
    print('icons written to icons/')
