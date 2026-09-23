"""Build NHMS backup archives as Excel workbooks inside a zip."""

from __future__ import annotations

import json
from io import BytesIO
import zipfile

from openpyxl import Workbook


def _excel_cell_value(value):
    if value is None:
        return ""
    if isinstance(value, (str, int, float, bool)):
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, (list, dict)):
        return json.dumps(value, default=str)
    return str(value)


def rows_to_xlsx_bytes(sheet_name: str, rows: list[dict]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = sheet_name[:31]
    if not rows:
        sheet.append(["(no rows)"])
    else:
        headers: list[str] = []
        seen: set[str] = set()
        for row in rows:
            for key in row.keys():
                if key not in seen:
                    seen.add(key)
                    headers.append(key)
        sheet.append(headers)
        for row in rows:
            sheet.append([_excel_cell_value(row.get(header)) for header in headers])
    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def build_excel_zip(payload: dict) -> bytes:
    skip = {"format", "generatedAt"}
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "README.txt",
            "NHMS daily backup. Each .xlsx file is one data table. Open with Microsoft Excel or LibreOffice.\n",
        )
        for key, value in payload.items():
            if key in skip or not isinstance(value, list):
                continue
            archive.writestr(f"{key}.xlsx", rows_to_xlsx_bytes(key, value))
    return buffer.getvalue()
