import os
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
import openpyxl
from io import BytesIO

from app.auth import get_current_user
from app.models import User
from app.survey_template import generate_survey_template_bytes

router = APIRouter(prefix="/api/results", tags=["Results & Analysis"])

FIXTURE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../fixtures/sample_results.json"))


@router.get("/survey-template")
def download_survey_template(current_user: User = Depends(get_current_user)):
    """Generate and download a blank Route Survey Excel workbook with native dropdown validations for Equipment and Soil Class."""
    content = generate_survey_template_bytes()
    headers = {
        "Content-Disposition": 'attachment; filename="Route_Survey_Template.xlsx"',
    }
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/sample")
def get_sample_results(current_user: User = Depends(get_current_user)):
    """Return mock benchmark result tables transcribed from docs/result.pdf."""
    if not os.path.exists(FIXTURE_PATH):
        raise HTTPException(status_code=404, detail="Sample results fixture not found")

    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    return {
        "banner": "Sample data – not a live calculation",
        "reference_document": "docs/result.pdf",
        "data": data,
    }


@router.post("/import-preview")
async def import_preview(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Stub import endpoint for Excel drag-and-drop: parses sheet names and row counts without running calculations."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported")

    content = await file.read()
    try:
        wb = openpyxl.load_workbook(BytesIO(content), data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel workbook: {str(e)}")

    sheets_info = []
    total_rows = 0
    errors = []

    for name in wb.sheetnames:
        ws = wb[name]
        rows = [r for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]
        count = len(rows)
        total_rows += count
        sheets_info.append({"sheet_name": name, "rows_count": count})
        if count == 0:
            errors.append(f"Sheet '{name}' contains 0 rows (empty)")

    return {
        "filename": file.filename,
        "total_sheets": len(wb.sheetnames),
        "total_rows": total_rows,
        "sheets": sheets_info,
        "validation_status": "VALID" if not errors else "WARNING",
        "errors": errors,
        "note": "File structure parsed successfully. No calculations were executed.",
    }
