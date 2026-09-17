"""Generate demo portrait images and PDF documents for seed commands."""

from __future__ import annotations

import hashlib
import io
import textwrap


def _hue_for_label(label: str) -> int:
    digest = hashlib.sha256(label.encode("utf-8")).hexdigest()
    return int(digest[:6], 16) % 360


def _hsl_to_rgb(h: float, s: float, l: float) -> tuple[int, int, int]:
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c / 2
    if h < 60:
        r, g, b = c, x, 0
    elif h < 120:
        r, g, b = x, c, 0
    elif h < 180:
        r, g, b = 0, c, x
    elif h < 240:
        r, g, b = 0, x, c
    elif h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return int((r + m) * 255), int((g + m) * 255), int((b + m) * 255)


def make_portrait_jpeg(full_name: str, size: int = 480) -> bytes:
    from PIL import Image, ImageDraw, ImageFont

    hue = _hue_for_label(full_name)
    top = _hsl_to_rgb(hue, 0.55, 0.42)
    bottom = _hsl_to_rgb((hue + 40) % 360, 0.45, 0.28)
    img = Image.new("RGB", (size, size), top)
    draw = ImageDraw.Draw(img)
    for y in range(size):
        blend = y / max(size - 1, 1)
        color = tuple(int(top[i] * (1 - blend) + bottom[i] * blend) for i in range(3))
        draw.line([(0, y), (size, y)], fill=color)

    parts = [p for p in full_name.replace(".", " ").split() if p]
    initials = "".join(p[0].upper() for p in parts[:2]) or "NH"
    face_r = int(size * 0.22)
    cx, cy = size // 2, int(size * 0.38)
    draw.ellipse((cx - face_r, cy - face_r, cx + face_r, cy + face_r), fill=(255, 230, 210))
    draw.ellipse((cx - face_r, cy - face_r, cx + face_r, cy + face_r), outline=(180, 140, 120), width=3)
    font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), initials, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2 - 4), initials, fill=(90, 55, 40), font=font)
    draw.rectangle((int(size * 0.18), int(size * 0.62), int(size * 0.82), int(size * 0.92)), fill=(245, 245, 250))
    draw.text((int(size * 0.22), int(size * 0.68)), full_name[:28], fill=(30, 30, 40), font=font)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return buf.getvalue()


def make_simple_pdf(title: str, body_lines: list[str]) -> bytes:
    lines = [title, ""] + body_lines
    y = 760
    content_parts = ["BT", "/F1 11 Tf"]
    for line in lines:
        wrapped = textwrap.wrap(line, width=78) or [""]
        for chunk in wrapped:
            safe = (
                chunk.replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replace("\n", " ")
            )
            content_parts.append(f"72 {y} Td ({safe}) Tj")
            y -= 16
    content_parts.append("ET")
    stream = "\n".join(content_parts).encode("latin-1", errors="replace")
    objects: list[bytes] = []
    objects.append(b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n")
    objects.append(b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n")
    objects.append(
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
    )
    objects.append(
        f"4 0 obj<< /Length {len(stream)} >>stream\n".encode("ascii") + stream + b"\nendstream\nendobj\n"
    )
    objects.append(b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n")
    header = b"%PDF-1.4\n"
    body = b"".join(objects)
    xref_positions = []
    cursor = len(header)
    for obj in objects:
        xref_positions.append(cursor)
        cursor += len(obj)
    xref = [b"xref\n0 6\n", b"0000000000 65535 f \n"]
    for pos in xref_positions:
        xref.append(f"{pos:010d} 00000 n \n".encode("ascii"))
    trailer = b"trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n" + str(cursor).encode("ascii") + b"\n%%EOF\n"
    return header + body + b"".join(xref) + trailer
