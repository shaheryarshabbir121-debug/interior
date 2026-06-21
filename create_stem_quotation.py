#!/usr/bin/env python3
"""
Pakistan Market Survey — Haier/Haitech STEM Lab Quotation
Prices researched June 2026 (PKR)
Exchange rate reference: 1 USD ≈ 280 PKR
"""

import openpyxl
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "STEM Lab Quotation - Pakistan"

# ── colour palette ──────────────────────────────────────────────────────────
DARK_BLUE  = "1F3864"
MID_BLUE   = "2E75B6"
LIGHT_BLUE = "D6E4F0"
ALT_ROW    = "EBF3FB"
GREEN      = "E2EFDA"
ORANGE     = "FCE4D6"
WHITE      = "FFFFFF"
YELLOW     = "FFF2CC"
GREY       = "F2F2F2"

def fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def border(style="thin"):
    s = Side(style=style)
    return Border(left=s, right=s, top=s, bottom=s)

def money(ws, cell_ref, value):
    ws[cell_ref] = value
    ws[cell_ref].number_format = '#,##0'

# ── helper: styled header cell ───────────────────────────────────────────────
def header_cell(ws, row, col, text, bg=DARK_BLUE, fg="FFFFFF",
                bold=True, size=11, align="center", wrap=True):
    cell = ws.cell(row=row, column=col, value=text)
    cell.font      = Font(bold=bold, color=fg, size=size, name="Calibri")
    cell.fill      = fill(bg)
    cell.alignment = Alignment(horizontal=align, vertical="center",
                               wrap_text=wrap)
    cell.border    = border()
    return cell

def data_cell(ws, row, col, value, bg=WHITE, bold=False,
              align="left", wrap=True, fmt=None):
    cell = ws.cell(row=row, column=col, value=value)
    cell.font      = Font(bold=bold, color="000000", size=10, name="Calibri")
    cell.fill      = fill(bg)
    cell.alignment = Alignment(horizontal=align, vertical="center",
                               wrap_text=wrap)
    cell.border    = border()
    if fmt:
        cell.number_format = fmt
    return cell

# ═══════════════════════════════════════════════════════════════════════════
# ROW 1 — main title
# ═══════════════════════════════════════════════════════════════════════════
ws.merge_cells("A1:J1")
ws["A1"] = "HAIER / HAITECH — STEM LAB QUOTATION (PAKISTAN MARKET SURVEY)"
ws["A1"].font      = Font(bold=True, color="FFFFFF", size=14, name="Calibri")
ws["A1"].fill      = fill(DARK_BLUE)
ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 36

# ROW 2 — subtitle / date
ws.merge_cells("A2:J2")
ws["A2"] = (
    "Prices researched: June 2026  |  Exchange Rate: 1 USD ≈ 280 PKR  |  "
    "Original Quotation Date: 20 June 2026  |  Currency: PKR (Pakistani Rupee)"
)
ws["A2"].font      = Font(italic=True, color=WHITE, size=10, name="Calibri")
ws["A2"].fill      = fill(MID_BLUE)
ws["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[2].height = 20

# ROW 3 — blank spacer
ws.row_dimensions[3].height = 6

# ═══════════════════════════════════════════════════════════════════════════
# ROW 4 — column headers
# ═══════════════════════════════════════════════════════════════════════════
HEADERS = [
    ("A", 6,  "S.No"),
    ("B", 34, "Product / Item"),
    ("C", 46, "Specification Summary"),
    ("D", 10, "Qty"),
    ("E", 20, "Unit Price\n(PKR) — Low"),
    ("F", 20, "Unit Price\n(PKR) — High"),
    ("G", 20, "Adopted Unit\nPrice (PKR)"),
    ("H", 22, "Total Price\n(PKR)"),
    ("I", 26, "Pakistan Market\nSource / Notes"),
    ("J", 28, "Remarks"),
]
for col_letter, width, text in HEADERS:
    col = openpyxl.utils.column_index_from_string(col_letter)
    header_cell(ws, 4, col, text)
    ws.column_dimensions[col_letter].width = width

ws.row_dimensions[4].height = 38

# ═══════════════════════════════════════════════════════════════════════════
# DATA — all items
# ═══════════════════════════════════════════════════════════════════════════
# Columns: sno, product, spec, qty, low, high, adopted, source, remarks
# total = qty × adopted  (added in formula)

SECTION_COLORS = {
    "STEM KITS / EDUCATIONAL EQUIPMENT": "2E75B6",
    "HARDWARE & TOOLS":                   "375623",
    "SCIENCE LAB EQUIPMENT":              "7030A0",
    "TECHNOLOGY / DIGITAL DEVICES":       "C55A11",
    "FURNITURE & FIXTURES":               "833C00",
    "ELECTRICAL & SAFETY":                "843C0C",
}

items = [
    # ── SECTION 1 ─────────────────────────────────────────────────────────
    ("__SECTION__", "STEM KITS / EDUCATIONAL EQUIPMENT", "", "", "", "", "", "", ""),
    (
        1,
        "Electronics Kit\n(Basic Electronic Circuit Kit)",
        "Breadboard, wires, resistors (1/4W), LEDs, capacitors, diodes, "
        "transistors, DC motors, buzzer, sensors. Soldering Station & Solar Panel NOT included.",
        4, 4_000, 6_500, 5_500,
        "Hafeez Center Lahore / Hall Road Lahore / Digilog.pk / circuit.pk",
        "Soldering station & solar panel excluded per spec"
    ),
    (
        2,
        "Arduino Starter Kit\n(Arduino Uno R3 Based)",
        "Arduino Uno R3 board, USB programming cable, breadboard, jumper wires, "
        "ultrasonic sensor, temperature sensor, push buttons, LEDs, resistors, coding tutorial manual.",
        4, 4_300, 7_415, 6_000,
        "Digilog.pk (Rs 4,300–5,500) / w11stop.com (Rs 6,674) / InStock.pk / Tejar.pk",
        "Prices updated May 2026"
    ),
    (
        3,
        "IoT Automation Kit",
        "NodeMCU (ESP8266) controller, relay module, temperature sensor, PIR motion sensor, "
        "LDR light sensor, jumper wires, power supply module, breadboard, DC fan, "
        "educational manual, ultrasonic sensor, acrylic sheet.",
        4, 8_000, 13_000, 10_000,
        "Digilog.pk (NodeMCU @ Rs 690) / HallRoadLahore.pk / circuit.pk / Rawlix.com",
        "Full kit assembled price; components individually available cheaper"
    ),
    (
        4,
        "Robotic Kit\n(Arduino UNO R3 + Robot Arm + Raspberry Pi 4B)",
        "Arduino UNO R3 board + 4–6 DOF Robot Arm Kit + Raspberry Pi 4 Model B (4GB RAM).",
        4, 45_000, 70_000, 55_000,
        "RPi 4B (4GB): Rs 38,000–52,000 (w11stop/robostan.pk) | Robot Arm: Rs 3,000–15,000 (digilog.pk/robostan.pk) | Arduino UNO: Rs 2,000–3,000",
        "RPi4 price volatile due to import duty; verify at time of purchase"
    ),
    (
        5,
        "Space Tech Kit",
        "Basic bottle rocket kit, solar system model, space mission simulation with controller, "
        "star charts, space science manual.",
        4, 8_000, 15_000, 12_000,
        "sciencestore.pk (Pakistan) / thespacestore.com / imported educational kits",
        "Limited local supply; may require import from China/India"
    ),
    (
        6,
        "Mathematics / Science Kit\n(数理综合教具套件)",
        "Geometry instruments (compass, protractor, ruler), basic simple machines kit, "
        "measurement tools (rulers, basic calipers), scientific calculator (basic), "
        "lab manual with 15+ curriculum experiments.",
        4, 5_000, 9_000, 7_000,
        "Casio scientific calculator Rs 1,500–3,000 (katib.pk) | Geometry set Rs 500–1,000 | Simple machines Rs 2,000–5,000 | Calipers Rs 500–1,500",
        "Casio FX-82/991 recommended for scientific calculator component"
    ),
    (
        7,
        "Hardware Tool Kit\n(劳技工具套装)",
        "Screwdriver set, wire cutter, wire stripper, soldering iron (40W), solder wire, "
        "tweezer set, safety goggles, anti-static work mat.",
        4, 6_500, 10_000, 8_000,
        "Ingco 18-pc screwdriver set Rs 4,830 (testinstruments.pk/toolsmart.pk) | Soldering iron Rs 600 (w11stop) | Wire stripper Rs 500–1,000 (ingcotool.pk) | Goggles Rs 400–800",
        "Ingco brand tools widely available in Pakistan"
    ),

    # ── SECTION 2 ─────────────────────────────────────────────────────────
    ("__SECTION__", "SCIENCE LAB EQUIPMENT", "", "", "", "", "", "", ""),
    (
        8,
        "Biology Kit\n(生物实验套件)",
        "40x–200x magnification basic microscope, glass slides, staining solutions, "
        "glass droppers, preserved specimens, petri dishes, biology charts pack, biology lab manual.",
        1, 18_000, 35_000, 28_000,
        "Student microscope Rs 10,000–20,000 (surgical-hut.com / alnafaysurgical.com / Daraz.pk) | Slides/specimens/petri Rs 3,000–8,000 (sciencebazar.pk / samtechlabs.com)",
        "40x–200x monocular student scope; bulk order discount possible"
    ),
    (
        9,
        "Chemistry Kit\n(化学实验套件)",
        "Beaker set, test tubes, measuring cylinder, conical flask, glass funnel, "
        "dropper/pipette set, stirring rod, spirit lamp, test tube holder, thermometer, "
        "filter paper, chemical reagent kit, chemistry lab manual.",
        1, 18_000, 30_000, 25_000,
        "labstore.pk / sciencebazar.pk / labchemcentre.com / cwtc.com.pk / labcare.com.pk",
        "Borosilicate glassware recommended; reagent kit subject to CDA/licensing"
    ),
    (
        10,
        "Physics Kit\n(物理实验套件)",
        "Magnetism kit, electricity kit, simple pendulum set, spring & Hooke's law kit, "
        "measurement tools, stopwatch, ammeter, voltmeter, physics experimentation kit, "
        "15+ curriculum experiments.",
        1, 18_000, 35_000, 28_000,
        "Local educational suppliers / sciencebazar.pk / labchemcentre.com",
        "Includes ammeter, voltmeter, bar magnets, spring sets, pendulum bob"
    ),

    # ── SECTION 3 ─────────────────────────────────────────────────────────
    ("__SECTION__", "TECHNOLOGY / DIGITAL DEVICES", "", "", "", "", "", "", ""),
    (
        11,
        "3D Printer — Entry-Level FDM\n(3D 打印机)",
        "Entry-level FDM technology; suitable for PLA/ABS. Build volume ~220×220×250 mm. "
        "(e.g. Creality Ender 3 NEO or equivalent).",
        1, 55_000, 80_000, 65_000,
        "Creality Ender 3 NEO: Rs 74,990 (grit3d.com / 3dprint.pk / creative3d.pk) | Entry FDM from Rs 55,000 (awaisinternational.com)",
        "Creality Ender 3 series most widely supported in Pakistan"
    ),
    (
        12,
        "3D Printer — goofoo GP1\n(高速FDM打印机)",
        "FDM technology | Max print speed: 500 mm/s | Build volume: 256×256×256 mm | "
        "1 nozzle | Print precision: ±0.1 mm | PEI-coated flexible steel sheet | "
        "Materials: PLA, ABS, ASA, PC | 5-inch IPS capacitive touch colour screen.",
        1, 150_000, 210_000, 180_000,
        "goofoo3d.com (import; USD ~580–700 ≈ PKR 162,400–196,000 at 280 PKR/USD) | Available via Botland/AliExpress import",
        "Import item; no official Pakistan dealer; add ~15–20% customs/shipping"
    ),
    (
        13,
        "VR Box — Generic Headset\n(VR简易头戴设备)",
        "Generic VR headset, Google Cardboard VR viewer, protective case, user manual. "
        "Compatible with smartphones 4.7\"–6.5\".",
        4, 1_800, 4_500, 3_000,
        "VR Shinecon box Rs 2,000–4,000 (Daraz.pk) | Basic cardboard VR Rs 1,718–6,299 (laptab.com.pk) | pakvr.com | alhamdtech.pk",
        "Generic/Shinecon brand; suitable for educational VR content"
    ),
    (
        14,
        "Smart TV with Speakers — 85\"\n(85英寸带音响智能电视)",
        "85\" panel | 4K UHD (3840×2160) | Aspect ratio 16:9 | Smart TV | "
        "2×10W amplified speakers | Active area: 1872×1053 mm.",
        1, 540_000, 680_000, 580_000,
        "TCL 85P8K QLED 4K Smart TV: Rs 564,999 (mega.pk / japanelectronics.com.pk — Mar 2026) | Haier 85\" QLED up to Rs 511,000+ | TCL/Haier range: Rs 540,000–750,000",
        "Haier 85\" with built-in speakers recommended; verify exact model with dealer"
    ),
    (
        15,
        "Computer System — Student AIO\n(电脑 — 学生用)",
        "All-in-One PC | CPU: Intel Core i5-13420H (RPL) | RAM: 16 GB DDR4 | "
        "Storage: 256 GB SSD (PCIe 3.0) | Display: 21.5\" FHD IPS 60 Hz 16:9 | "
        "Camera: 5 MP | I/O: 4× USB-A, 1× HDMI-out, earphone+MIC | Kbd+Mouse.",
        16, 80_000, 120_000, 95_000,
        "Chinese-brand AIO (Dahua/similar) 21.5\" i5: Rs 80,000–120,000 | Dahua DHI-AIO PC: Rs ~120,000–149,999 (mega.pk) | Dell/HP 24\" i5 AIOs: Rs 220,000–265,000 (higher tier)",
        "Chinese-brand 21.5\" AIO matches spec; Dell/HP would cost significantly more"
    ),
    (
        16,
        "Consumables — Annual\n(年度实验耗材)",
        "Annual lab consumables: replacement components, soldering supplies, chemicals, "
        "PLA/ABS filament rolls, slides, filter papers, reagents, printing paper, batteries, etc.",
        1, 150_000, 250_000, 200_000,
        "Estimated annual cost based on 16-student STEM lab in Pakistan",
        "Lump-sum annual budget estimate; actual cost depends on usage intensity"
    ),
    (
        17,
        "Recyclable & Eco-Friendly Materials\n(环保可循环手工材料)",
        "Recycled cardboard, craft paper, biodegradable glue, eco-friendly paints, "
        "recyclable plastic pieces, wood offcuts for hands-on STEM projects.",
        1, 40_000, 80_000, 60_000,
        "Local craft/stationery suppliers in Pakistan; Daraz.pk bulk craft materials",
        "Estimated; procure from local stationery/craft wholesalers"
    ),

    # ── SECTION 4 ─────────────────────────────────────────────────────────
    ("__SECTION__", "FURNITURE & FIXTURES", "", "", "", "", "", "", ""),
    (
        18,
        "Storage Cabinets\n(储物立柜)",
        "W 900 × D 400 × H 1090 mm | 0.5 mm cold-rolled steel sheet | Powder-coated finish.",
        8, 22_000, 38_000, 30_000,
        "Steel almirah/cabinet manufacturers in Pakistan: Rs 20,000–70,000 (subhanallahsteelsafe.com) | JS Racks / K Furnitures / Gujrat Steel: Rs 22,000–38,000 for this size",
        "Custom size; obtain quotes from local steel furniture manufacturers"
    ),
    (
        19,
        "Lab Tables — Height-Adjustable\n(实验桌/操作台)",
        "1200 × 600 mm top | Height: 600–760 mm (adjustable) | 12 mm HPL laminate top | "
        "Round steel tube frame with powder coating.",
        3, 35_000, 60_000, 45_000,
        "Height-adjustable HPL lab tables locally made in Pakistan: Rs 35,000–60,000 | labfurniture.pk / baristeelrack.com (Lahore) | School furniture manufacturers",
        "HPL (High Pressure Laminate) top is chemical/scratch resistant"
    ),
    (
        20,
        "Student Chairs\n(座椅)",
        "Seat diameter: φ315 mm | Seat height: ~450 mm | Seat top: ABS plastic | "
        "Frame: metal tube (powder coated).",
        25, 3_500, 5_500, 4_500,
        "Lab/school ABS plastic seat chairs in Pakistan: Rs 3,000–5,500 (schoolcrafts.com.pk / applefurniture.com.pk / Daraz.pk) | Basic study chair: Rs 3,499 (Daraz)",
        "Quantity estimated at 25 units (16 computer stations + lab table seats + spares)"
    ),
    (
        21,
        "Counters / Shelf Units\n(置物台/层架)",
        "Storage display counters and open shelving units for lab material storage. "
        "Steel or wood-steel construction.",
        3, 22_000, 45_000, 32_000,
        "Local furniture manufacturers / labfurniture.pk / schoolfurniture.com.pk | Open shelf racks Rs 10,000–45,000 (racksinfaisalabad.com)",
        "Spec not fully detailed; adjust per final dimensions"
    ),
    (
        22,
        "Blackout Blinds\n(遮光百叶窗)",
        "Blackout roller blinds / venetian-type blackout blinds. PVC-backed fabric. "
        "100% light blocking.",
        126, 350, 700, 500,
        "Blackout roller blinds: Rs 350–400/sq ft (darodeewar.com) | Roller blinds Rs 220–1,800/sq ft (lahoreblinds.com / aecinteriors.com.pk) | Estimated per blind unit ~0.8–1.4 sq ft",
        "126 units (individual blind slats/panels); verify window count & size on-site"
    ),
    (
        23,
        "Student Computer Desks\n(学生电脑桌)",
        "800 × 600 × 750 mm | Steel-wood construction with wooden desktop | "
        "Rear computer chassis compartment panel for tower PC.",
        16, 14_000, 25_000, 18_000,
        "Steel-wood computer desks locally made in Pakistan: Rs 14,000–25,000 | schoolfurniture.com.pk / local carpenter + metal fabricator",
        "One desk per student computer station; custom fabrication recommended"
    ),

    # ── SECTION 5 ─────────────────────────────────────────────────────────
    ("__SECTION__", "TEACHER'S EQUIPMENT", "", "", "", "", "", "", ""),
    (
        24,
        "Teacher's Laboratory Workbench\n(教师实验室工作台)",
        "Dimensions: 3000 × 700 × 850 mm | Countertop: 12.7 mm double-sided solid "
        "phenolic resin board | All-steel cabinet body | Central demonstration surface | "
        "Storage cabinets | Reserved spaces for main power control, multimedia (PC, monitor, "
        "central control, amplifier, switch).",
        1, 90_000, 160_000, 125_000,
        "Custom phenolic resin lab workbench in Pakistan: Rs 90,000–160,000 | baristeelrack.com (Lahore) / labfurniture.pk | Phenolic resin tops from Chinese suppliers",
        "Custom 3m bench; obtain formal quote from lab furniture specialist"
    ),
    (
        25,
        "Teacher's Computer System\n(教师电脑)",
        "All-in-One PC | CPU: Intel Core i5-13420H (RPL) | RAM: 16 GB DDR4 | "
        "Storage: 256 GB SSD (PCIe 3.0) | Display: 23.8\" FHD IPS 60 Hz 16:9 | "
        "Camera: 5 MP | I/O: 4× USB-A, 1× HDMI-out, earphone+MIC | Kbd+Mouse.",
        1, 100_000, 145_000, 120_000,
        "Dahua 23.8\" i5 AIO: Rs 235,000 (full brand) | Chinese-brand 23.8\" i5 AIO: Rs 100,000–145,000 | HP/Dell 24\" i5 AIO: Rs 219,999–265,000 (paklap.pk / czone.com.pk)",
        "23.8\" version of same spec as student unit but slightly larger"
    ),

    # ── SECTION 6 ─────────────────────────────────────────────────────────
    ("__SECTION__", "ELECTRICAL & SAFETY", "", "", "", "", "", "", ""),
    (
        26,
        "AC — 1.5 Ton Inverter\n(1.5匹空调)",
        "Brand: Haier or Enviro | 1.5-ton DC inverter air conditioner | Heat & cool | "
        "Energy-saving inverter compressor.",
        3, 118_000, 200_000, 150_000,
        "Haier 1.5T DC Inverter: Rs 131,000–237,000 (mega.pk / almumtaz.com.pk — Jun 2026) | Enviro A-Cool 1.5T Inverter: Rs 118,000 (priceoye.pk) | Enviro IceBerg T3: Rs 156,000–185,000",
        "Haier HSU-18HFP or Enviro EAC-18AS recommended; prices updated Jun 2026"
    ),
    (
        27,
        "Fire Extinguisher\n(灭火器)",
        "6 kg dry powder (ABC class) fire extinguisher. Suitable for Class A, B, C & electrical fires.",
        2, 5_000, 8_500, 6_500,
        "6 kg ABC dry powder extinguisher: Rs 4,500–8,000 in Karachi (karachifire.com) / Rs 4,000–7,500 in Lahore | hacsons.com / abdullahfireprotection.com.pk | cncelectric.pk",
        "Certified brands: Amerex, Kidde, local brands meeting PS 1568 / BS EN 3"
    ),
    (
        28,
        "Ceiling Fans — 56\"\n(风扇)",
        "56-inch (1400 mm sweep) ceiling fan. Energy-efficient copper-wound motor.",
        3, 9_000, 19_000, 12_000,
        "GFC Apex AC-DC 56\": Rs 10,300 | GFC Falcon 56\": Rs 10,000 | GFC Fanoos 56\": Rs 19,000 | GFC Deluxe Saver (50W): Rs 9,095 (sbestore.com / powerhouseexpress.com.pk / khanbrothersfan.com)",
        "GFC, Pak Fan, or Royal fans — all Pakistan-made 56\" models available"
    ),
]

# ═══════════════════════════════════════════════════════════════════════════
# Write data rows
# ═══════════════════════════════════════════════════════════════════════════
current_row = 5
row_colors  = [WHITE, ALT_ROW]
data_row_idx = 0  # alternates background for data rows

section_font_colors = {
    "STEM KITS / EDUCATIONAL EQUIPMENT": "FFFFFF",
    "HARDWARE & TOOLS":                   "FFFFFF",
    "SCIENCE LAB EQUIPMENT":              "FFFFFF",
    "TECHNOLOGY / DIGITAL DEVICES":       "FFFFFF",
    "FURNITURE & FIXTURES":               "FFFFFF",
    "TEACHER'S EQUIPMENT":                "FFFFFF",
    "ELECTRICAL & SAFETY":                "FFFFFF",
}
section_bg = {
    "STEM KITS / EDUCATIONAL EQUIPMENT": "2E75B6",
    "HARDWARE & TOOLS":                   "375623",
    "SCIENCE LAB EQUIPMENT":              "7030A0",
    "TECHNOLOGY / DIGITAL DEVICES":       "C55A11",
    "FURNITURE & FIXTURES":               "833C00",
    "TEACHER'S EQUIPMENT":                "1F497D",
    "ELECTRICAL & SAFETY":                "843C0C",
}

total_formula_rows = []  # track rows with total formula

for item in items:
    if item[0] == "__SECTION__":
        section_name = item[1]
        bg = section_bg.get(section_name, MID_BLUE)
        ws.merge_cells(f"A{current_row}:J{current_row}")
        c = ws.cell(row=current_row, column=1, value=f"  ▶  {section_name}")
        c.font      = Font(bold=True, color="FFFFFF", size=11, name="Calibri")
        c.fill      = fill(bg)
        c.alignment = Alignment(horizontal="left", vertical="center")
        c.border    = border()
        ws.row_dimensions[current_row].height = 24
        current_row += 1
        continue

    sno, product, spec, qty, low, high, adopted, source, remarks = item
    bg = row_colors[data_row_idx % 2]
    data_row_idx += 1

    data_cell(ws, current_row, 1, sno,     bg=bg, align="center", bold=True)
    data_cell(ws, current_row, 2, product, bg=bg, bold=True)
    data_cell(ws, current_row, 3, spec,    bg=bg)
    data_cell(ws, current_row, 4, qty,     bg=bg, align="center", bold=True, fmt="#,##0")
    data_cell(ws, current_row, 5, low,     bg=bg, align="right",  fmt="#,##0")
    data_cell(ws, current_row, 6, high,    bg=bg, align="right",  fmt="#,##0")
    # Adopted price — highlighted
    c_adopted = data_cell(ws, current_row, 7, adopted, bg=YELLOW, align="right",
                          bold=True, fmt="#,##0")
    # Total = qty × adopted  (formula)
    total_col = 8
    ws.cell(row=current_row, column=total_col,
            value=f"=D{current_row}*G{current_row}")
    ws.cell(row=current_row, column=total_col).number_format = "#,##0"
    ws.cell(row=current_row, column=total_col).font = Font(bold=True, color="000000",
                                                            size=10, name="Calibri")
    ws.cell(row=current_row, column=total_col).fill = fill(GREEN)
    ws.cell(row=current_row, column=total_col).alignment = Alignment(
        horizontal="right", vertical="center")
    ws.cell(row=current_row, column=total_col).border = border()
    total_formula_rows.append(current_row)

    data_cell(ws, current_row, 9, source,  bg=bg)
    data_cell(ws, current_row, 10, remarks, bg=bg)
    ws.row_dimensions[current_row].height = 58
    current_row += 1

# ═══════════════════════════════════════════════════════════════════════════
# GRAND TOTAL row
# ═══════════════════════════════════════════════════════════════════════════
current_row += 1
ws.merge_cells(f"A{current_row}:G{current_row}")
c = ws.cell(row=current_row, column=1,
            value="GRAND TOTAL  —  Pakistan Market Price (PKR)")
c.font      = Font(bold=True, color="FFFFFF", size=12, name="Calibri")
c.fill      = fill(DARK_BLUE)
c.alignment = Alignment(horizontal="right", vertical="center")
c.border    = border()

total_refs = "+".join([f"H{r}" for r in total_formula_rows])
ws.cell(row=current_row, column=8, value=f"={total_refs}")
ws.cell(row=current_row, column=8).number_format = "#,##0"
ws.cell(row=current_row, column=8).font      = Font(bold=True, color="FFFFFF",
                                                       size=13, name="Calibri")
ws.cell(row=current_row, column=8).fill      = fill(DARK_BLUE)
ws.cell(row=current_row, column=8).alignment = Alignment(horizontal="right",
                                                          vertical="center")
ws.cell(row=current_row, column=8).border = border()

ws.merge_cells(f"I{current_row}:J{current_row}")
note_cell = ws.cell(row=current_row, column=9,
                    value="All prices are market estimates for Pakistan (June 2026). "
                          "Final prices subject to negotiation, taxes (GST 17%) and delivery.")
note_cell.font      = Font(italic=True, size=9, name="Calibri")
note_cell.fill      = fill(LIGHT_BLUE)
note_cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
note_cell.border    = border()
ws.row_dimensions[current_row].height = 36

# ═══════════════════════════════════════════════════════════════════════════
# GST row
# ═══════════════════════════════════════════════════════════════════════════
current_row += 1
ws.merge_cells(f"A{current_row}:G{current_row}")
gst_label = ws.cell(row=current_row, column=1,
                    value="GST @ 17%  (if applicable)")
gst_label.font      = Font(bold=True, color="FFFFFF", size=11, name="Calibri")
gst_label.fill      = fill(MID_BLUE)
gst_label.alignment = Alignment(horizontal="right", vertical="center")
gst_label.border    = border()

prev_total_row = current_row - 1
ws.cell(row=current_row, column=8, value=f"=H{prev_total_row}*0.17")
ws.cell(row=current_row, column=8).number_format = "#,##0"
ws.cell(row=current_row, column=8).font      = Font(bold=True, color="FFFFFF",
                                                      size=11, name="Calibri")
ws.cell(row=current_row, column=8).fill      = fill(MID_BLUE)
ws.cell(row=current_row, column=8).alignment = Alignment(horizontal="right",
                                                          vertical="center")
ws.cell(row=current_row, column=8).border = border()
ws.merge_cells(f"I{current_row}:J{current_row}")
ws.cell(row=current_row, column=9, value="GST applicability depends on vendor registration status").border = border()
ws.row_dimensions[current_row].height = 24

# ═══════════════════════════════════════════════════════════════════════════
# TOTAL WITH GST row
# ═══════════════════════════════════════════════════════════════════════════
current_row += 1
ws.merge_cells(f"A{current_row}:G{current_row}")
total_gst_label = ws.cell(row=current_row, column=1,
                           value="TOTAL  (incl. GST @ 17%)")
total_gst_label.font      = Font(bold=True, color="FFFFFF", size=12, name="Calibri")
total_gst_label.fill      = fill("C00000")
total_gst_label.alignment = Alignment(horizontal="right", vertical="center")
total_gst_label.border    = border()

ws.cell(row=current_row, column=8,
        value=f"=H{current_row-2}+H{current_row-1}")
ws.cell(row=current_row, column=8).number_format = "#,##0"
ws.cell(row=current_row, column=8).font      = Font(bold=True, color="FFFFFF",
                                                      size=13, name="Calibri")
ws.cell(row=current_row, column=8).fill      = fill("C00000")
ws.cell(row=current_row, column=8).alignment = Alignment(horizontal="right",
                                                          vertical="center")
ws.cell(row=current_row, column=8).border = border()
ws.merge_cells(f"I{current_row}:J{current_row}")
ws.cell(row=current_row, column=9).border = border()
ws.row_dimensions[current_row].height = 30

# ═══════════════════════════════════════════════════════════════════════════
# Freeze panes & sheet settings
# ═══════════════════════════════════════════════════════════════════════════
ws.freeze_panes = "B5"
ws.sheet_view.showGridLines = True

# ── Save ────────────────────────────────────────────────────────────────────
out_path = "/home/user/interior/STEM_Lab_Pakistan_Market_Survey_2026.xlsx"
wb.save(out_path)
print(f"Saved: {out_path}")
