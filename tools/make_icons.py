"""Genera los íconos de la app (Pillow): 'Ciao' en blanco sobre verde y una franja tricolor discreta."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

GREEN = (30, 107, 71)       # --primary #1e6b47
STRIPE = [(46, 139, 87), (255, 255, 255), (192, 57, 43)]
FONT = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
OUT = Path(__file__).resolve().parent.parent / 'icons'


def icon(size):
    img = Image.new('RGB', (size, size), GREEN)
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(size * 0.30))
    text = 'Ciao'
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    d.text(((size - (r - l)) / 2 - l, size * 0.44 - (b - t) / 2 - t), text, font=font, fill='white')
    # Franja tricolor dentro de la zona segura (12 % de margen) para íconos "maskable".
    w, h = size * 0.46, max(2, size * 0.035)
    x0, y0 = (size - w) / 2, size * 0.66
    for i, c in enumerate(STRIPE):
        d.rectangle([x0 + i * w / 3, y0, x0 + (i + 1) * w / 3, y0 + h], fill=c)
    return img


for size, name in [(512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png')]:
    icon(size).save(OUT / name)
    print('ok', name)
