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


# NHS / WFH-inspired palette for patient education PDFs and banners
NHS_RED = (200, 16, 46)
NHS_NAVY = (30, 58, 95)
NHS_TEXT = (31, 41, 55)
NHS_MUTED = (107, 114, 128)
NHS_BG = (248, 250, 252)
NHS_WHITE = (255, 255, 255)
NHS_CALLOUT = (254, 242, 242)


def _load_fonts():
    from PIL import ImageFont

    candidates = [
        ("C:/Windows/Fonts/arial.ttf", 36, 28, 22, 18),
        ("C:/Windows/Fonts/segoeui.ttf", 36, 28, 22, 18),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36, 28, 22, 18),
        ("/System/Library/Fonts/Supplemental/Arial.ttf", 36, 28, 22, 18),
    ]
    for path, h1, h2, body, small in candidates:
        try:
            return (
                ImageFont.truetype(path, h1),
                ImageFont.truetype(path, h2),
                ImageFont.truetype(path, body),
                ImageFont.truetype(path, small),
            )
        except OSError:
            continue
    default = ImageFont.load_default()
    return default, default, default, default


def _wrap_text(draw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def make_banner_jpeg(title: str, subtitle: str, tag: str = "NHS Patient Guide", width: int = 1200, height: int = 675) -> bytes:
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (width, height), NHS_NAVY)
    draw = ImageDraw.Draw(img)
    font_title, font_sub, font_body, font_small = _load_fonts()

    for y in range(height):
        blend = y / max(height - 1, 1)
        color = tuple(int(NHS_NAVY[i] * (1 - blend * 0.35) + NHS_RED[i] * (blend * 0.35)) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)

    draw.rounded_rectangle((48, 48, width - 48, height - 48), radius=28, outline=(255, 255, 255, 80), width=3)
    draw.rounded_rectangle((72, 72, 280, 118), radius=16, fill=NHS_RED)
    draw.text((92, 82), tag[:34], fill=NHS_WHITE, font=font_small)

    title_lines = _wrap_text(draw, title, font_title, width - 160)[:3]
    y = 150
    for line in title_lines:
        draw.text((72, y), line, fill=NHS_WHITE, font=font_title)
        y += 46

    sub_lines = _wrap_text(draw, subtitle, font_sub, width - 160)[:2]
    y += 8
    for line in sub_lines:
        draw.text((72, y), line, fill=(226, 232, 240), font=font_sub)
        y += 34

    draw.text((72, height - 92), "Nepal Hemophilia Society  |  Patient education (editable in admin)", fill=(203, 213, 225), font=font_small)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def make_education_pdf(title: str, subtitle: str, sections: list[dict]) -> bytes:
    """Build a multi-page patient-education PDF with headings, bullets, tables, and bar charts."""
    from PIL import Image, ImageDraw

    page_w, page_h = 1190, 1684
    margin_x, margin_y = 90, 110
    content_w = page_w - margin_x * 2
    font_title, font_h2, font_body, font_small = _load_fonts()
    pages: list[Image.Image] = []

    def new_page() -> tuple[Image.Image, ImageDraw.ImageDraw, int]:
        page = Image.new("RGB", (page_w, page_h), NHS_BG)
        draw = ImageDraw.Draw(page)
        draw.rectangle((0, 0, page_w, 150), fill=NHS_NAVY)
        draw.rectangle((0, 150, page_w, 158), fill=NHS_RED)
        draw.text((margin_x, 42), "Nepal Hemophilia Society", fill=NHS_WHITE, font=font_small)
        draw.text((margin_x, 78), title[:70], fill=NHS_WHITE, font=font_h2)
        if subtitle:
            draw.text((margin_x, 118), subtitle[:90], fill=(226, 232, 240), font=font_small)
        return page, draw, 190

    page, draw, y = new_page()

    def ensure_space(needed: int):
        nonlocal page, draw, y
        if y + needed > page_h - 90:
            pages.append(page)
            page, draw, y = new_page()

    def draw_paragraph(text: str, color=NHS_TEXT):
        nonlocal y
        for line in _wrap_text(draw, text, font_body, content_w):
            ensure_space(34)
            draw.text((margin_x, y), line, fill=color, font=font_body)
            y += 34
        y += 10

    def draw_heading(text: str):
        nonlocal y
        ensure_space(56)
        draw.rounded_rectangle((margin_x, y, margin_x + content_w, y + 44), radius=10, fill=(239, 246, 255))
        draw.text((margin_x + 16, y + 10), text, fill=NHS_NAVY, font=font_h2)
        y += 58

    def draw_bullets(items: list[str]):
        nonlocal y
        for item in items:
            bullet_lines = _wrap_text(draw, item, font_body, content_w - 36)
            for idx, line in enumerate(bullet_lines):
                ensure_space(32)
                prefix = "•  " if idx == 0 else "   "
                draw.text((margin_x + 8, y), prefix + line, fill=NHS_TEXT, font=font_body)
                y += 32
        y += 8

    def draw_callout(text: str):
        nonlocal y
        lines = []
        for chunk in text.split("\n"):
            lines.extend(_wrap_text(draw, chunk, font_body, content_w - 48))
        box_h = len(lines) * 30 + 28
        ensure_space(box_h + 12)
        draw.rounded_rectangle((margin_x, y, margin_x + content_w, y + box_h), radius=14, fill=NHS_CALLOUT, outline=NHS_RED, width=2)
        ty = y + 14
        for line in lines:
            draw.text((margin_x + 20, ty), line, fill=NHS_RED, font=font_body)
            ty += 30
        y += box_h + 16

    def draw_table(headers: list[str], rows: list[list[str]]):
        nonlocal y
        col_w = content_w // max(len(headers), 1)
        row_h = 42
        ensure_space(row_h * (len(rows) + 2))
        x0 = margin_x
        draw.rectangle((x0, y, x0 + content_w, y + row_h), fill=NHS_NAVY)
        for i, header in enumerate(headers):
            draw.text((x0 + i * col_w + 12, y + 10), header[:22], fill=NHS_WHITE, font=font_small)
        y += row_h
        for row in rows:
            draw.rectangle((x0, y, x0 + content_w, y + row_h), outline=(229, 231, 235), width=1, fill=NHS_WHITE)
            for i, cell in enumerate(row):
                draw.text((x0 + i * col_w + 12, y + 10), str(cell)[:26], fill=NHS_TEXT, font=font_small)
            y += row_h
        y += 14

    def draw_chart(chart_title: str, labels: list[str], values: list[int]):
        nonlocal y
        chart_h = 260
        ensure_space(chart_h + 50)
        draw.text((margin_x, y), chart_title, fill=NHS_NAVY, font=font_h2)
        y += 40
        chart_top = y
        chart_bottom = y + chart_h - 40
        draw.rectangle((margin_x, chart_top, margin_x + content_w, chart_bottom), fill=NHS_WHITE, outline=(229, 231, 235), width=2)
        max_val = max(values) if values else 1
        bar_w = max(40, (content_w - 80) // max(len(labels), 1) - 20)
        gap = 20
        x = margin_x + 40
        for label, value in zip(labels, values, strict=False):
            bar_h = int((chart_bottom - chart_top - 60) * (value / max_val))
            bar_x1 = x
            bar_x2 = x + bar_w
            bar_y2 = chart_bottom - 30
            bar_y1 = bar_y2 - bar_h
            draw.rounded_rectangle((bar_x1, bar_y1, bar_x2, bar_y2), radius=8, fill=NHS_RED)
            draw.text((bar_x1, bar_y2 + 6), label[:10], fill=NHS_MUTED, font=font_small)
            draw.text((bar_x1, bar_y1 - 24), str(value), fill=NHS_NAVY, font=font_small)
            x += bar_w + gap
        y = chart_bottom + 24

    def draw_links(items: list[dict]):
        nonlocal y
        for item in items:
            label = item.get("label", "Link")
            url = item.get("url", "")
            ensure_space(34)
            draw.text((margin_x, y), f"→ {label}", fill=NHS_NAVY, font=font_body)
            y += 28
            if url:
                for line in _wrap_text(draw, url, font_small, content_w - 20):
                    ensure_space(24)
                    draw.text((margin_x + 16, y), line, fill=NHS_MUTED, font=font_small)
                    y += 24
            y += 6

    for section in sections:
        kind = section.get("type", "paragraph")
        if kind == "heading":
            draw_heading(section["text"])
        elif kind == "paragraph":
            draw_paragraph(section["text"])
        elif kind == "bullets":
            draw_bullets(section.get("items", []))
        elif kind == "callout":
            draw_callout(section["text"])
        elif kind == "table":
            draw_table(section.get("headers", []), section.get("rows", []))
        elif kind == "chart":
            draw_chart(section.get("title", ""), section.get("labels", []), section.get("values", []))
        elif kind == "links":
            draw_links(section.get("items", []))

    pages.append(page)
    buf = io.BytesIO()
    pages[0].save(buf, format="PDF", save_all=True, append_images=pages[1:], resolution=150.0)
    return buf.getvalue()
