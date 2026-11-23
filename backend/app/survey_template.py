import io
import openpyxl
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

EQUIPMENT_OPTIONS = [
    "None",
    "TF - 50kVA",
    "TF - 100kVA",
    "TF - 160kVA",
    "TF - 250kVA",
    "TF - 400kVA",
    "TF - 630kVA",
    "LBS",
    "AR",
]

SOIL_CLASS_OPTIONS = ["1", "2", "3", "4", "5"]

HEADERS = [
    "Section",
    "Pole No",
    "Aft Span (m)",
    "Fore Span (m)",
    "Deviation Angle (deg)",
    "Equipment",
    "Soil Class (1-5)",
]

GUIDANCE_ROWS = [
    ("Equipment", "None", "Standard pole with no mounted equipment (0 kg)"),
    ("Equipment", "TF - 50kVA", "50 kVA Distribution Transformer (415 kg, 0.85 m²)"),
    ("Equipment", "TF - 100kVA", "100 kVA Distribution Transformer (580 kg, 0.95 m²)"),
    ("Equipment", "TF - 160kVA", "160 kVA Distribution Transformer (750 kg, 1.10 m²)"),
    ("Equipment", "TF - 250kVA", "250 kVA Distribution Transformer (900 kg, 1.25 m²)"),
    ("Equipment", "TF - 400kVA", "400 kVA Distribution Transformer (1310 kg, 1.50 m²)"),
    ("Equipment", "TF - 630kVA", "630 kVA Distribution Transformer (1950 kg, 1.80 m²)"),
    ("Equipment", "LBS", "Load Break Switchgear (100 kg, 0.40 m²)"),
    ("Equipment", "AR", "Auto Recloser Protection (100 kg, 0.40 m²)"),
    ("Soil Class", "1", "Soft clay / silt (subgrade: 15,000 kN/m³)"),
    ("Soil Class", "2", "Firm clay (subgrade: 20,000 kN/m³)"),
    ("Soil Class", "3", "Stiff clay (subgrade: 25,000 kN/m³)"),
    ("Soil Class", "4", "Very stiff clay / dense sand (Default, subgrade: 30,000 kN/m³)"),
    ("Soil Class", "5", "Hard clay / rock (subgrade: 40,000 kN/m³)"),
    ("Continuity Rule", "Fore(n) = Aft(n+1)", "The fore span of pole n must equal the aft span of pole n+1"),
]


def generate_survey_template_bytes() -> bytes:
    wb = openpyxl.Workbook()

    # ─────────────────────────────────────────────────────────────
    # Sheet 1: Route Survey
    # ─────────────────────────────────────────────────────────────
    ws = wb.active
    ws.title = "Route Survey"

    # Header styling
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")  # Dark Blue
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="thin", color="CBD5E1"),
    )
    center_align = Alignment(horizontal="center", vertical="center")

    for col_num, header in enumerate(HEADERS, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border

    # Blank survey entry rows (100 rows ready for entry)
    blank_font = Font(name="Calibri", size=11)
    for r in range(2, 102):
        for c in range(1, len(HEADERS) + 1):
            cell = ws.cell(row=r, column=c)
            cell.font = blank_font
            cell.border = thin_border
            if c in (1, 2, 6, 7):
                cell.alignment = center_align

    # Column widths
    col_widths = {1: 12, 2: 12, 3: 16, 4: 16, 5: 22, 6: 22, 7: 20}
    for col_num, width in col_widths.items():
        ws.column_dimensions[get_column_letter(col_num)].width = width

    # ─────────────────────────────────────────────────────────────
    # Sheet 2: Equipment & Guidance (Reference List)
    # ─────────────────────────────────────────────────────────────
    ws_ref = wb.create_sheet(title="Equipment & Guidance")

    ref_headers = ["Parameter", "Allowed Values / Format", "Description / Specifications"]
    ref_fill = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
    for col_num, header in enumerate(ref_headers, 1):
        cell = ws_ref.cell(row=1, column=col_num, value=header)
        cell.fill = ref_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border

    for row_num, (param, val, desc) in enumerate(GUIDANCE_ROWS, 2):
        c1 = ws_ref.cell(row=row_num, column=1, value=param)
        c2 = ws_ref.cell(row=row_num, column=2, value=val)
        c3 = ws_ref.cell(row=row_num, column=3, value=desc)
        for cell in (c1, c2, c3):
            cell.font = blank_font
            cell.border = thin_border
        c1.alignment = Alignment(horizontal="left", vertical="center")
        c2.alignment = Alignment(horizontal="center" if param != "Continuity Rule" else "left", vertical="center")
        c3.alignment = Alignment(horizontal="left", vertical="center")

    ref_widths = {1: 18, 2: 26, 3: 65}
    for col_num, width in ref_widths.items():
        ws_ref.column_dimensions[get_column_letter(col_num)].width = width

    # ─────────────────────────────────────────────────────────────
    # Native Excel Dropdowns (Data Validation) on Sheet 1
    # ─────────────────────────────────────────────────────────────
    # Reference ranges on the Guidance sheet for dropdowns
    # Equipment is in 'Equipment & Guidance'!B2:B10
    # Soil Class is in 'Equipment & Guidance'!B11:B15

    dv_equip = DataValidation(
        type="list",
        formula1="'Equipment & Guidance'!$B$2:$B$10",
        allow_blank=True,
    )
    dv_equip.error = "Please select a valid equipment option from the dropdown list."
    dv_equip.errorTitle = "Invalid Equipment"
    dv_equip.prompt = "Select pole-mounted transformer or switchgear"
    dv_equip.promptTitle = "Equipment Selection"

    ws.add_data_validation(dv_equip)
    dv_equip.add("F2:F101")

    dv_soil = DataValidation(
        type="list",
        formula1="'Equipment & Guidance'!$B$11:$B$15",
        allow_blank=True,
    )
    dv_soil.error = "Please select a soil class from 1 to 5."
    dv_soil.errorTitle = "Invalid Soil Class"
    dv_soil.prompt = "Select soil class (1 = Soft, 4 = Dense sand, 5 = Rock)"
    dv_soil.promptTitle = "Geotechnical Soil Class"

    ws.add_data_validation(dv_soil)
    dv_soil.add("G2:G101")

    # Save to in-memory bytes buffer
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream.getvalue()
