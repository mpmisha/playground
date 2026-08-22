#!/usr/bin/env python3
"""Generates the Flappy Bird app icon for the Playground hub.

Original artwork drawn from scratch: a twilight gradient plate with a small
beveled candy-block bird (round body, wing, gold beak) — matching the game's
in-canvas art style. Writes multiple PNG sizes into icons/.
"""

import colorsys
import os

from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")

SIZE = 1024
BACKGROUND_TOP = (92, 120, 219)
BACKGROUND_BOTTOM = (56, 66, 153)
BIRD_COLOR = (250, 153, 51)  # orange, from the Candy block palette
BEAK_COLOR = (255, 204, 61)
EYE_COLOR = (32, 38, 79)


def scale_rgb(rgb, factor):
    r, g, b = (c / 255.0 for c in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    v = max(0.0, min(1.0, v * factor))
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return (int(r * 255), int(g * 255), int(b * 255))


def blend_white(rgb, amount):
    return tuple(int(c + (255 - c) * amount) for c in rgb)


def draw_gradient(image):
    draw = ImageDraw.Draw(image)
    for y in range(SIZE):
        ratio = y / (SIZE - 1)
        color = tuple(
            int(BACKGROUND_TOP[i] + (BACKGROUND_BOTTOM[i] - BACKGROUND_TOP[i]) * ratio)
            for i in range(3)
        )
        draw.line([(0, y), (SIZE, y)], fill=color)


def draw_bird(overlay):
    draw = ImageDraw.Draw(overlay)
    cx, cy = SIZE * 0.46, SIZE * 0.52
    r = SIZE * 0.30

    # Soft plate behind the bird so it reads clearly at small sizes.
    plate_r = r * 1.32
    draw.ellipse(
        [cx - plate_r, cy - plate_r, cx + plate_r, cy + plate_r],
        fill=(38, 45, 96, 255),
    )

    # Body (beveled).
    body = scale_rgb(BIRD_COLOR, 0.62)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=body + (255,))
    inset = r * 0.12
    draw.ellipse(
        [cx - r + inset, cy - r + inset * 0.7, cx + r - inset, cy + r - inset * 1.3],
        fill=BIRD_COLOR + (255,),
    )

    gloss = blend_white(BIRD_COLOR, 0.22)
    gloss_r = r * 0.7
    draw.ellipse(
        [cx - gloss_r, cy - r * 0.55, cx + gloss_r, cy - r * 0.05],
        fill=gloss + (255,),
    )

    hl = blend_white(BIRD_COLOR, 0.62)
    hl_w, hl_h = r * 0.34, r * 0.2
    hx, hy = cx - r * 0.42, cy - r * 0.5
    draw.ellipse([hx, hy, hx + hl_w, hy + hl_h], fill=hl + (255,))

    # Wing.
    wing = scale_rgb(BIRD_COLOR, 0.8)
    wx, wy = cx - r * 0.15, cy + r * 0.15
    draw.ellipse(
        [wx - r * 0.5, wy - r * 0.32, wx + r * 0.5, wy + r * 0.32],
        fill=wing + (255,),
    )

    # Beak.
    beak_pts = [
        (cx + r * 0.82, cy - r * 0.18),
        (cx + r * 1.28, cy + r * 0.02),
        (cx + r * 0.82, cy + r * 0.28),
    ]
    draw.polygon(beak_pts, fill=BEAK_COLOR + (255,))

    # Eye.
    eye_r = r * 0.13
    ex, ey = cx + r * 0.32, cy - r * 0.34
    draw.ellipse([ex - eye_r, ey - eye_r, ex + eye_r, ey + eye_r], fill=EYE_COLOR + (255,))


def main():
    image = Image.new("RGB", (SIZE, SIZE), BACKGROUND_TOP)
    draw_gradient(image)

    overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_bird(overlay)

    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")

    os.makedirs(OUT_DIR, exist_ok=True)
    for size, name in [(1024, "icon-1024.png"), (512, "icon-512.png"), (192, "icon-192.png"), (180, "icon-180.png")]:
        resized = image.resize((size, size), Image.LANCZOS)
        path = os.path.join(OUT_DIR, name)
        resized.save(path, "PNG")
        print(f"Wrote {path} ({size}x{size})")


if __name__ == "__main__":
    main()
