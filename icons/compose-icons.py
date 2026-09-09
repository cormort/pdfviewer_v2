#!/usr/bin/env python3
"""Build the PNG icons from a rasterised icons/icon.svg.

icon.svg is the source of truth. Rasterise it once at 1024x1024 with a
transparent background, then run this from the repository root:

    python3 icons/compose-icons.py /tmp/book-1024.png

Any renderer that honours SVG filters will do. feDropShadow is what gives the
book its shadow, and some converters silently drop filters, so check the output
has a shadow before shipping it. Headless Chromium was used for the committed
files.

Two kinds of output. The plain icons keep the transparent ground the SVG was
drawn on. The maskable icons and the Apple touch icon need an opaque one: a
launcher crops a maskable icon to its own shape, and iOS composites a
transparent icon onto black. Both get the app's off-white, which the teal book
sits on cleanly.
"""
import sys
from PIL import Image

GROUND = (251, 251, 249, 255)      # --bg-primary
SAFE = 0.78                        # maskable artwork stays inside the safe zone


def place(book, size, ground=None, scale=1.0):
    canvas = Image.new('RGBA', (size, size), ground or (0, 0, 0, 0))
    target = int(size * scale)
    art = book.resize((target, target), Image.LANCZOS)
    offset = (size - target) // 2
    canvas.alpha_composite(art, (offset, offset))
    return canvas


def main(source):
    book = Image.open(source).convert('RGBA')
    if book.width != book.height:
        raise SystemExit('the rendered SVG must be square')

    for size in (192, 512):
        place(book, size).save(f'icons/icon-{size}.png')
        place(book, size, ground=GROUND, scale=SAFE).save(f'icons/icon-{size}-maskable.png')
    place(book, 180, ground=GROUND).save('icons/apple-touch-icon.png')
    print('icons written to icons/')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
