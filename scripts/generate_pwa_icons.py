"""Generate PWA icons programmatically with Pillow (no external deps)."""
import os
from PIL import Image, ImageDraw

os.makedirs('public/icons', exist_ok=True)

# Brand colors
BG_DARK = (7, 3, 20, 255)        # #070314
GRAD_A = (0, 167, 157, 255)       # #00A79D (teal)
GRAD_B = (28, 117, 188, 255)      # #1C75BC (blue)
WHITE = (255, 255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def draw_gradient_circle(draw, cx, cy, r, color_a, color_b):
    steps = max(int(r), 1)
    for i in range(steps, 0, -1):
        t = 1 - i / steps
        c = lerp(color_a, color_b, t)
        draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=c)


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    """Draws the brand logo (hexagon + rocket accent) onto a canvas."""
    if maskable:
        # Maskable: full bleed, logo occupies inner 80% (safe zone = outer 10% on each side)
        canvas_size = size
        logo_size = int(size * 0.70)
        img = Image.new('RGBA', (canvas_size, canvas_size), BG_DARK)
        draw = ImageDraw.Draw(img)
        cx, cy = canvas_size // 2, canvas_size // 2
    else:
        # Any: rounded square with 22% radius, generous padding
        canvas_size = size
        logo_size = int(size * 0.78)
        img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
        # Draw rounded-square background
        radius = int(size * 0.22)
        bg = Image.new('RGBA', (canvas_size, canvas_size), BG_DARK)
        msk = Image.new('L', (canvas_size, canvas_size), 0)
        msk_draw = ImageDraw.Draw(msk)
        msk_draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=radius, fill=255)
        img.paste(bg, (0, 0), msk)
        draw = ImageDraw.Draw(img)
        cx, cy = canvas_size // 2, canvas_size // 2

    # Hexagon background (gradient by drawing concentric hexagons)
    hex_r = logo_size // 2
    hex_h = int(hex_r * (3 ** 0.5))  # pointy-top hex
    # Draw a few overlapping hexagons with gradient colors
    for i in range(8, 0, -1):
        t = 1 - i / 8
        c = lerp(GRAD_A, GRAD_B, t)
        r = int(hex_r * (0.55 + 0.06 * i))
        h = int(r * (3 ** 0.5))
        pts = []
        for k in range(6):
            angle = -90 + 60 * k
            import math
            rad = math.radians(angle)
            x = cx + int(r * math.cos(rad))
            y = cy + int(r * math.sin(rad))
            pts.append((x, y))
        draw.polygon(pts, fill=c)

    # Inner "rocket" symbol (simple stylized "F" / chevron)
    # Use white lines forming a stylized rocket/foguete
    # Draw a simple rocket: triangle + rectangle body + flames
    fw = int(logo_size * 0.5)
    fh = int(logo_size * 0.7)
    fx = cx - fw // 2
    fy = cy - fh // 2
    # Body
    body_w = int(fw * 0.4)
    body_x = cx - body_w // 2
    draw.rectangle([body_x, fy + int(fh * 0.1), body_x + body_w, fy + int(fh * 0.75)], fill=WHITE)
    # Tip (triangle)
    tip = [
        (cx, fy),
        (body_x, fy + int(fh * 0.15)),
        (body_x + body_w, fy + int(fh * 0.15)),
    ]
    draw.polygon(tip, fill=WHITE)
    # Fins (left + right)
    fin_h = int(fh * 0.18)
    fin_w = int(fw * 0.18)
    draw.polygon([
        (body_x, fy + int(fh * 0.55)),
        (body_x - fin_w, fy + int(fh * 0.75)),
        (body_x, fy + int(fh * 0.75)),
    ], fill=WHITE)
    draw.polygon([
        (body_x + body_w, fy + int(fh * 0.55)),
        (body_x + body_w + fin_w, fy + int(fh * 0.75)),
        (body_x + body_w, fy + int(fh * 0.75)),
    ], fill=WHITE)
    # Window (circle in body)
    win_r = int(body_w * 0.25)
    draw.ellipse([
        cx - win_r, fy + int(fh * 0.28),
        cx + win_r, fy + int(fh * 0.28) + 2 * win_r,
    ], fill=GRAD_A)
    # Flame at bottom
    flame_y = fy + int(fh * 0.78)
    flame_h = int(fh * 0.18)
    draw.polygon([
        (body_x + 2, flame_y),
        (cx, flame_y + flame_h),
        (body_x + body_w - 2, flame_y),
    ], fill=GRAD_A)

    return img


for size in [192, 512]:
    img = make_icon(size, maskable=False)
    img.save(f'public/icons/icon-{size}.png', 'PNG')
    print(f'OK icon-{size}.png')

for size in [192, 512]:
    img = make_icon(size, maskable=True)
    img.save(f'public/icons/icon-maskable-{size}.png', 'PNG')
    print(f'OK icon-maskable-{size}.png')

# Favicon 64
img = make_icon(64, maskable=False)
img.save('public/favicon.png', 'PNG')
print('OK favicon.png')

# Apple touch icon (180)
img = make_icon(180, maskable=False)
img.save('public/apple-touch-icon.png', 'PNG')
print('OK apple-touch-icon.png')

print('\nAll icons generated in public/icons/')
