from PIL import Image
import os

base = os.path.join(os.path.dirname(__file__), "..", "patient-app", "assets", "images")
src = Image.open(os.path.join(base, "nhs-logo-full.png")).convert("RGBA")
w, h = src.size
icon_region = src.crop((0, 0, w, int(h * 0.52)))
bg = icon_region.getpixel((10, 10))
threshold = 18


def dist(c1, c2):
    return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))


bbox = None
pixels = icon_region.load()
for y in range(icon_region.height):
    for x in range(icon_region.width):
        if dist(pixels[x, y], bg) > threshold:
            if bbox is None:
                bbox = [x, y, x, y]
            else:
                bbox[0] = min(bbox[0], x)
                bbox[1] = min(bbox[1], y)
                bbox[2] = max(bbox[2], x)
                bbox[3] = max(bbox[3], y)

if bbox:
    pad = 24
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(icon_region.width, bbox[2] + pad)
    bottom = min(icon_region.height, bbox[3] + pad)
    cropped = icon_region.crop((left, top, right, bottom))
else:
    cropped = icon_region

out_patient = os.path.join(base, "nhs-logo-drop.png")
out_admin = os.path.join(os.path.dirname(__file__), "..", "admin-panel", "public", "nhs-logo.png")
cropped.save(out_patient, optimize=True)

target_w = 512
scale = target_w / cropped.width
display = cropped.resize((target_w, int(cropped.height * scale)), Image.Resampling.LANCZOS)
display.save(out_admin, optimize=True)
display.save(os.path.join(base, "nhs-logo-icon-clear.png"), optimize=True)
print(f"cropped {cropped.size} -> {out_patient}")
print(f"display {display.size} -> {out_admin}")
