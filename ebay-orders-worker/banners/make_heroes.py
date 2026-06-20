# -*- coding: utf-8 -*-
"""Elira Living — square 1600x1600 branded eBay gallery heroes (eBay-gallery safe)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
BODONI = os.path.join(HERE, "fonts", "BodoniModa.ttf")
JOST   = os.path.join(HERE, "fonts", "Jost.ttf")

S = 1600
GOLD, GOLD_D = (200, 162, 78), (168, 132, 58)
MOSS, SAGE, CREAM, SAND, INK = (67, 84, 58), (157, 176, 138), (243, 238, 227), (227, 234, 221), (47, 58, 42)

PRODUCTS = [
    {"img": "cream.jpg",    "name": "Sensitive Feuchtigkeitscreme", "line": "Duftfrei · 50 ml", "out": "147354251499"},
    {"img": "cleanser.jpg", "name": "Radiant Glow Gesichtsreiniger", "line": "COSMOS Natural · 145 ml", "out": "147355903667"},
    {"img": "toner.jpg",    "name": "Klärendes Gesichtswasser", "line": "Naturkosmetik · 200 ml", "out": "147362947382"},
    {"img": "serum.jpg",    "name": "Retinol-Alternative Serum", "line": "Anti-Aging · 30 ml", "out": "147365337645"},
    {"img": "peptide.jpg",  "name": "Peptid Anti-Aging Serum", "line": "Hexapeptid-11 · 30 ml", "out": "peptide"},
    {"img": "shampoo.jpg",  "name": "Sensitive Kopfhaut Shampoo", "line": "Empfindliche Kopfhaut · 400 ml", "out": "shampoo"},
]
BADGES = ["VEGAN", "COSMOS NATURAL", "MADE IN EU", "TIERVERSUCHSFREI"]


def vfont(path, size, wght=400, opsz=None):
    f = ImageFont.truetype(path, size)
    try:
        axes = []
        for a in f.get_variation_axes():
            nm = (a["name"].decode() if isinstance(a["name"], bytes) else a["name"]).lower()
            if nm.startswith("opt") and opsz is not None: axes.append(opsz)
            elif nm.startswith("wei") or nm == "weight": axes.append(wght)
            else: axes.append(a.get("default", a["minimum"]))
        f.set_variation_by_axes(axes)
    except Exception:
        pass
    return f


def tracked(draw, xy, text, font, fill, tr, center_w=None):
    w = sum(draw.textlength(c, font=font) for c in text) + tr * (len(text) - 1)
    x, y = xy
    if center_w is not None: x = (center_w - w) / 2
    for c in text:
        draw.text((x, y), c, font=font, fill=fill); x += draw.textlength(c, font=font) + tr
    return w


def bg():
    base = Image.new("RGB", (S, S), CREAM)
    px = base.load()
    for y in range(S):
        for x in range(0, S, 4):
            t = (x / S * 0.5 + y / S * 0.5)
            c = tuple(int(CREAM[i] + (SAND[i] - CREAM[i]) * t) for i in range(3))
            for dx in range(4):
                if x + dx < S: px[x + dx, y] = c
    glow = Image.new("L", (S, S), 0)
    ImageDraw.Draw(glow).ellipse([S - 700, S - 520, S + 220, S + 300], fill=60)
    base = Image.composite(Image.new("RGB", (S, S), SAGE), base, glow.filter(ImageFilter.GaussianBlur(160)))
    return base.convert("RGBA")


def card(photo, w, h, r=34):
    pw, ph = photo.size
    sc = max(w / pw, h / ph)
    photo = photo.resize((int(pw * sc), int(ph * sc)), Image.LANCZOS)
    l, t = (photo.width - w) // 2, (photo.height - h) // 2
    photo = photo.crop((l, t, l + w, t + h)).convert("RGBA")
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
    photo.putalpha(m)
    return photo


def build(p):
    img = bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([34, 34, S - 35, S - 35], 26, outline=GOLD + (150,), width=3)

    # top brand block
    tracked(d, (0, 150), "NATURKOSMETIK · VEGAN", vfont(JOST, 34, 500), MOSS, 9, center_w=S)
    tracked(d, (0, 196), "ELIRA LIVING", vfont(BODONI, 132, 600, opsz=72), GOLD_D, 6, center_w=S)

    # product card (centered)
    cw, ch = 720, 760
    cx, cy = (S - cw) // 2, 400
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([cx, cy + 22, cx + cw, cy + ch + 22], 34, fill=(60, 70, 50, 95))
    img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(34)))
    d = ImageDraw.Draw(img)
    photo = Image.open(os.path.join(HERE, "products", p["img"])).convert("RGB")
    c = card(photo, cw, ch)
    img.paste(c, (cx, cy), c)
    d.rounded_rectangle([cx, cy, cx + cw - 1, cy + ch - 1], 34, outline=GOLD + (200,), width=3)

    # name + badges bottom
    tracked(d, (0, 1230), p["name"], vfont(BODONI, 60, 500, opsz=28), INK, 1, center_w=S)
    tracked(d, (0, 1306), p["line"], vfont(JOST, 36, 400), MOSS, 2, center_w=S)
    bf = vfont(JOST, 27, 500)
    widths = [sum(d.textlength(ch2, font=bf) for ch2 in b) + 1.5 * (len(b) - 1) for b in BADGES]
    pad, gap = 22, 18
    total = sum(w + pad * 2 for w in widths) + gap * (len(BADGES) - 1)
    bx, by = (S - total) / 2, 1380
    for b, w in zip(BADGES, widths):
        d.rounded_rectangle([bx, by, bx + w + pad * 2, by + 52], 26, outline=SAGE, width=2)
        tracked(d, (bx + pad, by + 12), b, bf, MOSS, 1.5)
        bx += w + pad * 2 + gap

    out = os.path.join(HERE, f"hero-{p['out']}.jpg")
    img.convert("RGB").save(out, "JPEG", quality=88, optimize=True)
    print(f"  hero-{p['out']}.jpg ({os.path.getsize(out)//1024} KB)")


print("Building square heroes…")
for p in PRODUCTS:
    build(p)
print("Done.")
