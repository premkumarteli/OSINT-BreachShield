import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import os
import shutil

# Target Output Paths
out_final_draft_docx = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Report_DRAFT.docx'
out_final_report_docx = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Project_Report.docx'
out_phase2_report_docx = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\BreachShield_Phase2_Project_Report.docx'

# Assets
figures_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\figures'
diagrams_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\diagrams'
snapshots_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\snapshots'
acharya_logo = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\acharya_logo.jpg'

doc = docx.Document()

# -----------------------------------------------------------------
# Page Setup: Left 1.25", Right 1.0", Top 0.75", Bottom 0.75" (A4)
# -----------------------------------------------------------------
sec = doc.sections[0]
sec.top_margin = Inches(0.75)
sec.bottom_margin = Inches(0.75)
sec.left_margin = Inches(1.25)
sec.right_margin = Inches(1.0)
sec.page_width = Inches(8.27)
sec.page_height = Inches(11.69)

# 1. VTU Double Page Border (thinThickSmallGap, sz 24, space 24)
border_xml = parse_xml(r'''
    <w:pgBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:offsetFrom="page">
        <w:top w:val="thinThickSmallGap" w:sz="24" w:space="24" w:color="auto"/>
        <w:left w:val="thinThickSmallGap" w:sz="24" w:space="31" w:color="auto"/>
        <w:bottom w:val="thickThinSmallGap" w:sz="24" w:space="24" w:color="auto"/>
        <w:right w:val="thickThinSmallGap" w:sz="24" w:space="24" w:color="auto"/>
    </w:pgBorders>
''')
sec._sectPr.append(border_xml)

# Configure Different First Page (clean Outer Cover Page without running header/footer)
sec.different_first_page_header_footer = True

# 2. Running Header (for Page 2 onwards)
header = sec.header
p_head = header.paragraphs[0]
p_head.alignment = WD_ALIGN_PARAGRAPH.RIGHT
pPr_h = p_head._p.get_or_add_pPr()
pBdr_h = parse_xml(r'''
    <w:pBdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:bottom w:val="single" w:sz="6" w:space="4" w:color="CCCCCC"/>
    </w:pBdr>
''')
pPr_h.append(pBdr_h)
r_head = p_head.add_run("BreachShield: AI Powered OSINT Breach Detection & Dark Web Protection")
r_head.font.name = "Times New Roman"
r_head.font.size = Pt(9)
r_head.font.italic = True
r_head.font.color.rgb = RGBColor(90, 90, 90)

# 3. Running Footer
footer = sec.footer
p_foot = footer.paragraphs[0]
p_foot.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
pPr_f = p_foot._p.get_or_add_pPr()
pBdr_f = parse_xml(r'''
    <w:pBdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:top w:val="single" w:sz="6" w:space="4" w:color="CCCCCC"/>
    </w:pBdr>
''')
pPr_f.append(pBdr_f)
r_foot_l = p_foot.add_run("Dept. of ISE, AcIT                                                               2026 - 2027\t")
r_foot_l.font.name = "Times New Roman"
r_foot_l.font.size = Pt(9)
r_foot_l.font.bold = True
r_foot_l.font.color.rgb = RGBColor(80, 80, 80)

# Dynamic Page Number Field
fldSimple = OxmlElement('w:fldSimple')
fldSimple.set(qn('w:instr'), 'PAGE')
p_foot._p.append(fldSimple)

FONT_NAME = 'Times New Roman'
NAVY = RGBColor(16, 44, 87)
BLACK = RGBColor(0, 0, 0)
DARK_GRAY = RGBColor(60, 60, 60)
WHITE = RGBColor(255, 255, 255)
MAROON = RGBColor(140, 0, 0)

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def add_p(text="", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, line_spacing=1.5, bold=False, italic=False, size=12, color=BLACK):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if text:
        r = p.add_run(text)
        r.font.name = FONT_NAME
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.italic = italic
        r.font.color.rgb = color
    return p

def add_chapter_heading(ch_num_str, title_str):
    doc.add_page_break()
    add_p(ch_num_str, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=24, space_after=4, bold=True, size=16, color=NAVY)
    add_p(title_str, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=18, bold=True, size=18, color=BLACK)

def add_sec_heading(sec_str):
    add_p(sec_str, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=4, bold=True, size=14, color=NAVY)

def add_subsec_heading(subsec_str):
    add_p(subsec_str, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=3, bold=True, size=12.5, color=DARK_GRAY)

def add_body_p(text):
    return add_p(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6, line_spacing=1.5, size=12)

def add_bullet_p(bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.3
    r1 = p.add_run(bold_prefix + " ")
    r1.font.name = FONT_NAME
    r1.font.size = Pt(11.5)
    r1.font.bold = True
    r2 = p.add_run(text)
    r2.font.name = FONT_NAME
    r2.font.size = Pt(11.5)
    return p

def add_image_box(img_path, caption_str, width_in=5.6):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(width_in))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(12)
        r_c = p_cap.add_run(caption_str)
        r_c.font.name = FONT_NAME
        r_c.font.size = Pt(10.5)
        r_c.font.bold = True
        r_c.font.italic = True
        r_c.font.color.rgb = DARK_GRAY

# ============================================================
# 1. FRONT OUTER COVER PAGE (Project Work -OuterPage.doc)
# ============================================================
add_p("VISVESVARAYA TECHNOLOGICAL UNIVERSITY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=2, bold=True, size=15, color=NAVY)
add_p('"Jnana Sangama", Belagavi - 590 018', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=12, bold=False, size=12)

if os.path.exists(acharya_logo):
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(4)
    p_logo.paragraph_format.space_after = Pt(10)
    p_logo.add_run().add_picture(acharya_logo, width=Inches(1.8))

add_p("A Major Project Phase-II Report on", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=6, italic=True, size=12)
add_p("BREACHSHIELD: AI-POWERED OSINT BREACH DETECTION & DARK WEB PROTECTION", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=10, bold=True, size=16, color=NAVY)

add_p("A Dissertation work submitted in partial fulfillment of the requirement for the award of the degree of", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4, italic=True, size=11)
add_p("BACHELOR OF ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, bold=True, size=14, color=NAVY)
add_p("in", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=1, size=11)
add_p("INFORMATION SCIENCE AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=14, bold=True, size=13, color=NAVY)

# Table for Student details & Guide
tbl_cov = doc.add_table(rows=1, cols=2)
tbl_cov.alignment = WD_TABLE_ALIGNMENT.CENTER
c_left = tbl_cov.cell(0, 0)
c_right = tbl_cov.cell(0, 1)

p_sl = c_left.paragraphs[0]
p_sl.paragraph_format.line_spacing = 1.2
r_slh = p_sl.add_run("Submitted by:\n")
r_slh.font.bold = True
r_slh.font.size = Pt(11)
r_slh.font.name = FONT_NAME
students_text = "ARVIND D H\t (1AY24IS400)\nGIRISHKUMAR N M\t (1AY24IS404)\nMANOJ\t (1AY24IS406)\nPREMKUMAR TELI\t (1AY24IS407)"
r_slt = p_sl.add_run(students_text)
r_slt.font.size = Pt(10.5)
r_slt.font.name = FONT_NAME

p_sr = c_right.paragraphs[0]
p_sr.paragraph_format.line_spacing = 1.2
r_srh = p_sr.add_run("Under the Guidance of:\n")
r_srh.font.bold = True
r_srh.font.size = Pt(11)
r_srh.font.name = FONT_NAME
guide_text = "Prof. SUSHMA T. M.\nAssistant Professor\nDept. of ISE, AIT"
r_srt = p_sr.add_run(guide_text)
r_srt.font.size = Pt(10.5)
r_srt.font.name = FONT_NAME

add_p("", space_before=10, space_after=4)
add_p("DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=2, bold=True, size=12.5, color=NAVY)
add_p("ACHARYA INSTITUTE OF TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, bold=True, size=14, color=NAVY)
add_p("(Affiliated to Visvesvaraya Technological University, Belagavi, Approved by AICTE, New Delhi, Accredited by NAAC)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=2, size=9)
add_p("Acharya Dr. Sarvepalli Radhakrishnan Road, Soladevanahalli, Bangalore - 560 107", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=4, size=9.5)
add_p("2026 - 2027", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=0, bold=True, size=12, color=NAVY)

# ============================================================
# 2. INNER CERTIFICATE PAGE (Project Work - Inner CertificatePage.doc)
# ============================================================
doc.add_page_break()

if os.path.exists(acharya_logo):
    p_logo2 = doc.add_paragraph()
    p_logo2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo2.paragraph_format.space_before = Pt(4)
    p_logo2.paragraph_format.space_after = Pt(6)
    p_logo2.add_run().add_picture(acharya_logo, width=Inches(1.4))

add_p("DEPARTMENT OF INFORMATION SCIENCE & ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, bold=True, size=13, color=NAVY)
add_p("ACHARYA INSTITUTE OF TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, bold=True, size=14, color=NAVY)
add_p("(Affiliated to Visvesvaraya Technological University, Belagavi, Recognized by NAAC, New Delhi)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=14, size=9)

add_p("CERTIFICATE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=16, bold=True, size=16, color=NAVY)

cert_text = (
    'This is to certify that the Major Project Phase-II (BIS786) entitled "BREACHSHIELD: AI-POWERED OSINT '
    'BREACH DETECTION & DARK WEB PROTECTION" carried out by ARVIND D H (1AY24IS400), GIRISHKUMAR N M (1AY24IS404), '
    'MANOJ (1AY24IS406), and PREMKUMAR TELI (1AY24IS407), are bonafide students of Acharya Institute of Technology, '
    'Bengaluru, in partial fulfillment for the award of the degree of Bachelor of Engineering in Information Science '
    'and Engineering of the Visvesvaraya Technological University, Belagavi during the academic year 2026-27. '
    'It is certified that all corrections/suggestions indicated for Internal Assessment have been incorporated in the '
    'report deposited in the departmental library. The Major Project Phase-II report has been approved as it satisfies '
    'the academic requirements in respect of Major Project Phase-II (BIS786) prescribed for the said degree.'
)
add_body_p(cert_text)

add_p("", space_before=24, space_after=0)

# Signatures Table (Guide, HOD, Principal)
tbl_sig = doc.add_table(rows=1, cols=3)
tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
c1, c2, c3 = tbl_sig.cell(0, 0), tbl_sig.cell(0, 1), tbl_sig.cell(0, 2)

p_g = c1.paragraphs[0]
p_g.paragraph_format.line_spacing = 1.15
r_g1 = p_g.add_run("Signature of the Guide\n\n\n\n")
r_g2 = p_g.add_run("Prof. Sushma T. M.\n")
r_g2.font.bold = True
r_g3 = p_g.add_run("Assistant Professor\nDept. of ISE, AcIT")

p_h = c2.paragraphs[0]
p_h.paragraph_format.line_spacing = 1.15
p_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_h1 = p_h.add_run("Signature of the HOD\n\n\n\n")
r_h2 = p_h.add_run("Prof. Mithuna H. R.\n")
r_h2.font.bold = True
r_h3 = p_h.add_run("Head of the Department\nDept. of ISE, AcIT")

p_p = c3.paragraphs[0]
p_p.paragraph_format.line_spacing = 1.15
p_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r_p1 = p_p.add_run("Signature of Principal\n\n\n\n")
r_p2 = p_p.add_run("Dr. C. K. Marigowda\n")
r_p2.font.bold = True
r_p3 = p_p.add_run("Principal\nAcIT, Bengaluru")

add_p("", space_before=24, space_after=0)
add_p("External Viva Voce Examination", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=8, space_after=6, bold=True, size=11, color=NAVY)

tbl_viva = doc.add_table(rows=3, cols=2)
tbl_viva.alignment = WD_TABLE_ALIGNMENT.CENTER
tbl_viva.cell(0, 0).paragraphs[0].add_run("Name of the Examiner").font.bold = True
tbl_viva.cell(0, 1).paragraphs[0].add_run("Signature with Date").font.bold = True
tbl_viva.cell(1, 0).paragraphs[0].add_run("1. __________________________________")
tbl_viva.cell(1, 1).paragraphs[0].add_run("____________________")
tbl_viva.cell(2, 0).paragraphs[0].add_run("2. __________________________________")
tbl_viva.cell(2, 1).paragraphs[0].add_run("____________________")

# ============================================================
# 3. DECLARATION PAGE (declaration.doc)
# ============================================================
doc.add_page_break()
add_p("DECLARATION", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, size=16, color=NAVY)

dec_text = (
    "We, ARVIND D H (1AY24IS400), GIRISHKUMAR N M (1AY24IS404), MANOJ (1AY24IS406), and PREMKUMAR TELI (1AY24IS407), "
    "students of Bachelor of Engineering in Information Science and Engineering, Acharya Institute of Technology, "
    'Bangalore, hereby declare that the Major Project Phase-II (BIS786) work entitled "BREACHSHIELD: AI-POWERED OSINT '
    'BREACH DETECTION & DARK WEB PROTECTION" is an authentic work carried out by us under the supervision and guidance '
    "of Prof. Sushma T. M., Assistant Professor, Department of Information Science and Engineering, Acharya Institute of "
    "Technology, Bangalore.\n\n"
    "We further declare that we have not submitted the matter embodied in this report to Visvesvaraya Technological "
    "University or any other university or institution for the award of any degree or diploma."
)
add_body_p(dec_text)

add_p("", space_before=16, space_after=2)
add_p("Place: Bengaluru\nDate: 12-10-2026", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=4, space_after=16, bold=True, size=11)

tbl_dec = doc.add_table(rows=5, cols=3)
tbl_dec.alignment = WD_TABLE_ALIGNMENT.CENTER
dec_headers = ["Name", "USN", "Signature"]
for idx, h in enumerate(dec_headers):
    c = tbl_dec.cell(0, idx)
    set_cell_background(c, "F0F4F8")
    p = c.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(11)

students = [
    ("Arvind D H", "1AY24IS400"),
    ("Girishkumar N M", "1AY24IS404"),
    ("Manoj", "1AY24IS406"),
    ("Premkumar Teli", "1AY24IS407")
]
for idx, (s_name, s_usn) in enumerate(students):
    r_idx = idx + 1
    tbl_dec.cell(r_idx, 0).paragraphs[0].add_run(s_name)
    tbl_dec.cell(r_idx, 1).paragraphs[0].add_run(s_usn)
    tbl_dec.cell(r_idx, 2).paragraphs[0].add_run("..................................")

# ============================================================
# 4. ACKNOWLEDGEMENT PAGE (Sample_ACK and Abstract.doc)
# ============================================================
doc.add_page_break()
add_p("ACKNOWLEDGEMENT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, size=16, color=NAVY)

ack_text_1 = (
    "The satisfaction and euphoria that accompany the successful completion of the Major Project Phase-II (BIS786) "
    "report would be incomplete without mentioning the people who made it possible through their constant guidance, "
    "scholarly critique, and intellectual encouragement."
)
add_body_p(ack_text_1)

ack_text_2 = (
    "We take this opportunity to express our deepest gratitude to Sri. B. Premnath Reddy, Founder Chairman, Acharya Institutes, "
    "and Dr. C. K. Marigowda, Principal, Acharya Institute of Technology, for providing the necessary academic infrastructure, "
    "laboratories, and institutional support to complete this Major Project Phase-II work.\n\n"
    "We express our sincere thanks to Prof. Mithuna H. R., Head of the Department, Department of Information Science and "
    "Engineering, for her constant support, valuable suggestions, and academic encouragement throughout the course of this project.\n\n"
    "We also extend our grateful appreciation to our Project Coordinators, Prof. Yogesh N and Dr. Pankaj Kumar, for their "
    "thorough reviews, structured guidelines, and meticulous administrative coordination during Phase-I and Phase-II evaluations.\n\n"
    "We place on record our profound sense of gratitude to our respected Guide, Prof. Sushma T. M., Assistant Professor, "
    "Department of Information Science and Engineering, for her invaluable guidance, constructive criticism, inspiring "
    "discussions, and constant motivation during every stage of development and report preparation.\n\n"
    "A warm thanks to all the faculty and staff of the Department of Information Science and Engineering, who have helped us "
    "with their views and encouraging ideas. Finally, we wish to express our heartfelt thanks to our parents, family members, "
    "and fellow classmates who directly or indirectly contributed to the successful completion of this project."
)
add_body_p(ack_text_2)

add_p("", space_before=16, space_after=2)
add_p("Project Team Members:", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=True, size=11, color=NAVY)
add_p("Arvind D H (1AY24IS400)\nGirishkumar N M (1AY24IS404)\nManoj (1AY24IS406)\nPremkumar Teli (1AY24IS407)", align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=2, space_after=0, size=10.5)

# ============================================================
# 5. ABSTRACT PAGE (Sample_ACK and Abstract.doc)
# ============================================================
doc.add_page_break()
add_p("ABSTRACT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, size=16, color=NAVY)

abstract_content = (
    "BreachShield is a privacy-preserving cybersecurity breach-intelligence platform that enables users to ascertain "
    "whether a personal identifier (such as an email address or mobile phone number) has been exposed in public data breaches "
    "or underground dark-web repositories. The foundational design principle of the platform is zero-knowledge query privacy: "
    "the sensitive identifier is never transmitted to the backend server. The client browser computes a cryptographic SHA-256 "
    "hash of the normalized identifier, transmits strictly the initial five hexadecimal characters (20 bits) to the API gateway, "
    "downloads the candidate suffix records matching that prefix, and executes the exact match locally. This range-query protocol "
    "leverages the k-anonymity model, guaranteeing that the server and intermediate eavesdroppers learn only that the target "
    "belongs to an equivalence set of hundreds of candidate records.\n\n"
    "Surrounding this core privacy engine, the platform incorporates out-of-band multi-factor authentication using One-Time Passwords "
    "(OTPs) dispatched via secure SMTP email or a dedicated native Android SMS gateway over persistent WebSockets, effectively "
    "preventing automated mass scraping of organizational directories. An asynchronous OSINT scraper engine actively ingests threat "
    "dumps from public paste sites, GitHub mirrors, and underground Telegram channels. To evaluate incident severity, the system "
    "employs a dual-layer risk scoring pipeline comprising deterministic rule sets and a trained Random Forest classifier achieving "
    "99.8% precision, complemented by a DistilBERT URL transformer for detecting phishing links embedded in breach records.\n\n"
    "To establish verifiable auditability and solve the vulnerability of mutable audit trails, query logs and scraper transactions "
    "are batched into SHA-256 Merkle trees whose roots are periodically anchored into an Ethereum-compatible smart contract, enabling "
    "cryptographic proof of existence and non-repudiation. The user interface is developed as a high-performance React 19 single-page HUD "
    "terminal featuring live streaming telemetry and exposure risk radars. Exhaustive empirical validation across 101 backend unit and "
    "integration tests, 50 frontend tests, and network packet inspections confirms that BreachShield achieves zero raw identifier leakage, "
    "sub-100ms response times, and robust forensic audit integrity, meeting all academic requirements for Major Project Phase-II (BIS786) "
    "and yielding an accepted IEEE Conference publication."
)
add_body_p(abstract_content)

# ============================================================
# 6. TABLE OF CONTENTS (Table of Contents.doc)
# ============================================================
doc.add_page_break()
add_p("TABLE OF CONTENTS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=18, bold=True, size=16, color=NAVY)

toc_data = [
    ("Acknowledgement", "Acknowledgement", "i"),
    ("Abstract", "Abstract", "ii"),
    ("Table of Contents", "Table of Contents", "iii"),
    ("List of Figures", "List of Figures", "iv"),
    ("List of Tables", "List of Tables", "v"),
    ("1", "INTRODUCTION", "1"),
    ("", "1.1 Overview", "1"),
    ("", "1.2 Motivation", "2"),
    ("", "1.3 Objective", "3"),
    ("", "1.4 Scope", "3"),
    ("", "1.5 Existing System", "4"),
    ("", "1.6 Proposed System", "4"),
    ("2", "PROBLEM STATEMENT", "5"),
    ("", "2.1 Problem Statement", "5"),
    ("", "2.2 Motivation", "6"),
    ("", "2.3 Objectives", "6"),
    ("3", "DETAILED SURVEY", "7"),
    ("4", "SURVEY SUMMARY TABLE", "10"),
    ("5", "SYSTEM REQUIREMENT SPECIFICATION", "12"),
    ("", "5.1 Functional Requirements", "12"),
    ("", "5.2 Non-functional Requirements", "13"),
    ("", "5.3 Hardware Requirements", "14"),
    ("", "5.4 Software Requirements", "14"),
    ("6", "SYSTEM DESIGN", "15"),
    ("", "6.1 System Architecture", "15"),
    ("", "6.2 Module Design", "17"),
    ("", "6.3 Detailed UML Design (Class, Activity, Use Case, DFD)", "18"),
    ("7", "IMPLEMENTATION", "22"),
    ("", "7.1 Repository Layout", "22"),
    ("", "7.2 Client-Side k-Anonymity Search", "23"),
    ("", "7.3 OTP Login and Verification", "24"),
    ("", "7.4 Source Dispatch and Collection", "25"),
    ("", "7.5 Exposure Scoring and Machine Learning", "26"),
    ("", "7.6 Audit Log and Blockchain Anchoring", "27"),
    ("", "7.7 Fallback Storage and Error Handling", "28"),
    ("8", "TESTING", "29"),
    ("", "8.1 Approach & Test Environment", "29"),
    ("", "8.2 Unit and Integration Results", "30"),
    ("", "8.3 Security and Privacy Verification", "31"),
    ("9", "TEST CASES AND RESULTS (SNAPSHOTS)", "32"),
    ("", "9.1 Test Cases Execution Matrix", "32"),
    ("", "9.2 Machine Learning Evaluation", "34"),
    ("", "9.3 System Verification Snapshots", "35"),
    ("Conclusion", "CONCLUSION AND FUTURE ENHANCEMENTS", "38"),
    ("Bibliography", "BIBLIOGRAPHY", "39"),
    ("10", "OUTCOME (RESEARCH PAPER)", "41"),
    ("Appendix A", "APPENDIX A: LIST OF FIGURES", "42"),
    ("Appendix B", "APPENDIX B: LIST OF TABLES", "43")
]

tbl_toc = doc.add_table(rows=len(toc_data) + 1, cols=3)
tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
headers_toc = ["Chapter No.", "Title", "Page No."]
for c_idx, h in enumerate(headers_toc):
    cell = tbl_toc.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx != 1 else WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(11)

for r_idx, (c_no, c_title, p_no) in enumerate(toc_data):
    row_cells = tbl_toc.rows[r_idx + 1].cells
    row_cells[0].paragraphs[0].add_run(c_no).font.size = Pt(10.5)
    row_cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t = row_cells[1].paragraphs[0].add_run(c_title)
    r_t.font.size = Pt(10.5)
    if c_no and not c_no.startswith(" "):
        r_t.font.bold = True
    row_cells[2].paragraphs[0].add_run(p_no).font.size = Pt(10.5)
    row_cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

# ============================================================
# 7. LIST OF FIGURES & LIST OF TABLES
# ============================================================
doc.add_page_break()
add_p("LIST OF FIGURES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=14, bold=True, size=16, color=NAVY)

figures_list = [
    ("Fig 6.1", "System Architecture of BreachShield", "16"),
    ("Fig 6.2", "UML Class Diagram of the API Gateway & Domain Entities", "18"),
    ("Fig 6.3", "Activity Diagram: Out-of-Band OTP Login Flow", "19"),
    ("Fig 6.4", "Activity Diagram: Private Range Lookup & Source Dispatch", "20"),
    ("Fig 6.5", "Use Case Diagram Modeling Analyst & Attacker Interactions", "21"),
    ("Fig 6.6", "Data Flow Diagram (Level 1: OSINT Ingestion & Processing)", "21"),
    ("Fig 7.1", "Merkle Tree Construction and Smart Contract Anchoring Pipeline", "28"),
    ("Fig 9.1", "Comparative Classification Accuracy Across ML Threat Models", "34"),
    ("Fig 9.2", "Per-Class F1-Score Breakdown for Threat Severity Classification", "35"),
    ("Fig 9.3", "Verification Snapshot: Login Page & Dual-Channel OTP Input Step", "36"),
    ("Fig 9.4", "Verification Snapshot: Network DevTools Range-Query Inspection", "36"),
    ("Fig 9.5", "Verification Snapshot: Test Terminal Execution (101/101 & 50/50 Passed)", "37"),
    ("Fig 9.6", "Verification Snapshot: Results HUD Console & Exposure Radar", "37")
]

tbl_lof = doc.add_table(rows=len(figures_list) + 1, cols=3)
tbl_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Figure No.", "Figure Caption", "Page No."]):
    cell = tbl_lof.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx != 1 else WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(11)

for r_idx, (f_no, f_title, p_no) in enumerate(figures_list):
    cells = tbl_lof.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(f_no).font.size = Pt(10.5)
    cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[1].paragraphs[0].add_run(f_title).font.size = Pt(10.5)
    cells[2].paragraphs[0].add_run(p_no).font.size = Pt(10.5)
    cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

add_p("", space_before=20, space_after=4)
add_p("LIST OF TABLES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=14, bold=True, size=16, color=NAVY)

tables_list = [
    ("Table 4.1", "Survey Summary by Research Domain", "10"),
    ("Table 4.2", "Comparative Design Choices (Existing Services vs BreachShield)", "11"),
    ("Table 5.1", "Functional Requirements Specification (FR1 to FR8)", "12"),
    ("Table 5.2", "Non-Functional Quality Attributes and Targets", "13"),
    ("Table 5.3", "Hardware Environment Requirements", "14"),
    ("Table 5.4", "Software and Technology Stack Specifications", "14"),
    ("Table 6.1", "Core Architectural Module Responsibilities", "17"),
    ("Table 9.1", "Comprehensive Test Cases Execution Matrix and Outcomes", "32"),
    ("Table 9.2", "Machine Learning Performance Benchmarking Metrics", "34"),
    ("Table 9.3", "Per-Class Precision, Recall, and F1 Performance", "35"),
    ("Table 10.1", "Publication Details for Major Project Phase-II Outcome", "41")
]

tbl_lot = doc.add_table(rows=len(tables_list) + 1, cols=3)
tbl_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Table No.", "Table Description", "Page No."]):
    cell = tbl_lot.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx != 1 else WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(11)

for r_idx, (t_no, t_title, p_no) in enumerate(tables_list):
    cells = tbl_lot.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(t_no).font.size = Pt(10.5)
    cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[1].paragraphs[0].add_run(t_title).font.size = Pt(10.5)
    cells[2].paragraphs[0].add_run(p_no).font.size = Pt(10.5)
    cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

# ============================================================
# CHAPTER 1: INTRODUCTION
# ============================================================
add_chapter_heading("CHAPTER 1", "INTRODUCTION")

add_sec_heading("1.1 Overview")
add_body_p(
    "BreachShield is a specialized web platform that tells a user whether an email address or phone number appears "
    "in known data-breach records. Its fundamental engineering principle is that the sensitive identifier itself must "
    "never be transmitted across the network to the backend server. The client browser computes a cryptographic SHA-256 "
    "hash of the normalized identifier, extracts only the first five hexadecimal characters (20 bits) of that hash, "
    "transmits this prefix to the server, and receives all stored breach records whose hashes begin with those five characters. "
    "The client browser then checks for an exact match locally. This range-query approach is based on the k-anonymity privacy "
    "model [2], [3], ensuring that the queried identifier remains mathematically indistinguishable within an equivalence class "
    "of hundreds of candidate records."
)
add_body_p(
    "Around this core privacy-preserving search engine, BreachShield implements a comprehensive operational architecture. "
    "To prevent automated scrapers from weaponizing the tool for mass directory reconnaissance, the system enforces out-of-band "
    "One-Time-Password (OTP) login via secure email SMTP or cellular SMS relays. The underlying intelligence index is populated "
    "by a registry of breach-source adapters, including a local breach catalog and an active Telegram channel scraper. "
    "When a breach record is identified, an exposure risk scoring engine evaluates incident severity, assisted by a pretrained "
    "transformer model for classifying malicious phishing URLs embedded in breach dumps. Finally, all search and scraping events "
    "are recorded in an audit log that is batched into Merkle trees and anchored onto an Ethereum-compatible blockchain smart "
    "contract, providing mathematical proof of audit trail integrity."
)
add_body_p(
    "The platform is engineered as a clean four-tier monorepo: a React 19 frontend, an Express 5 API gateway in Node.js, a Python "
    "FastAPI microservice for Telegram collection and machine learning inference, and an Android Kotlin application that relays OTP "
    "messages as cellular SMS. A machine learning classification model classifies breach incident severity, providing automated triage "
    "for security analysts."
)

add_sec_heading("1.2 Motivation")
add_body_p(
    "Public breach checkers such as HaveIBeenPwned and DeHashed allow individuals and system administrators to discover whether "
    "their credentials have been compromised in historical corporate leaks. However, existing services present significant security "
    "trade-offs that motivated the engineering of BreachShield:"
)
add_bullet_p("1. Query Privacy Vulnerability:", "Submitting a plaintext identifier over HTTPS still exposes the queried entity to intermediate proxy inspection, DNS sniffers, and the backend server's access logs. If a user queries an executive email address, the server operator or an eavesdropper learns that the executive is currently under investigation, creating a secondary privacy breach.")
add_bullet_p("2. Unauthenticated Reconnaissance:", "Open breach lookup portals that do not enforce out-of-band identity verification permit adversaries to perform automated credential stuffing queries against organizational domains, harvesting breach intelligence without authorization.")
add_bullet_p("3. Vulnerability of Relational Logs:", "Centralized relational databases permit privileged administrators to alter, delete, or suppress audit records. In forensic investigations or compliance audits, organizations cannot prove whether a breach inquiry occurred or whether threat records were manipulated post-facto.")
add_bullet_p("4. Monolithic and Unexplainable Scoring:", "Existing platforms provide binary compromised/clean flags without explaining contributing factors, credential decay over time, or associated phishing URLs.")

add_sec_heading("1.3 Objective")
add_body_p(
    "The primary objective of BreachShield is to build a unified, privacy-preserving breach detection and threat intelligence platform "
    "satisfying the following concrete goals:"
)
add_bullet_p("• Objective 1:", "Implement client-side k-anonymity search using SHA-256 5-character prefix matching, ensuring zero plaintext identifier transmission.")
add_bullet_p("• Objective 2:", "Enforce out-of-band multi-factor authentication using bcrypt-hashed OTPs dispatched via email SMTP and native Android SMS relays over WebSockets.")
add_bullet_p("• Objective 3:", "Deploy an asynchronous OSINT ingestion engine capable of scraping real-time leak dumps from paste repositories and Telegram channels.")
add_bullet_p("• Objective 4:", "Construct an automated Merkle tree audit logging engine anchored to an EVM smart contract, establishing tamper-evident chain-of-custody.")
add_bullet_p("• Objective 5:", "Deliver a high-performance React 19 Cyberpunk HUD terminal user interface with sub-100ms lookup latency and real-time telemetry streaming.")

add_sec_heading("1.4 Scope")
add_body_p(
    "BreachShield addresses threat monitoring for enterprise security personnel, privacy researchers, and individual users. "
    "The system operates strictly on publicly accessible OSINT threat feeds, open paste sites, and public Telegram channels without "
    "conducting unauthorized network penetration or offensive intrusions. The zero-knowledge design ensures compliance with GDPR "
    "and India's Digital Personal Data Protection (DPDP) Act 2023 by preventing intermediate retention of raw user search queries."
)

add_sec_heading("1.5 Existing System")
add_body_p(
    "In conventional breach lookup systems, the client transmits the search target (e.g., alice@company.com) directly to a centralized "
    "API endpoint. The server checks its database and returns matched breach events. While services like HaveIBeenPwned implement "
    "k-anonymity for passwords, they require plaintext submission for email searches. Furthermore, audit logs in existing platforms "
    "are maintained in standard SQL databases that lack cryptographic immutability, and access is either entirely unrestricted or protected "
    "only by basic CAPTCHAs that are easily bypassed by modern optical character recognition (OCR) bots."
)

add_sec_heading("1.6 Proposed System")
add_body_p(
    "The proposed BreachShield platform resolves these limitations through a layered defense-in-depth architecture. "
    "Search queries are protected by client-side SHA-256 5-character prefix partitioning, reducing server-side exposure to an anonymous "
    "equivalence class. Access is strictly guarded by out-of-band dual-channel OTP verification. Query audit events are batched into Merkle "
    "trees and anchored onto an Ethereum smart contract. Raw dumps harvested from Telegram channels are evaluated using Random Forest "
    "and transformer models to classify threat severity, and results are visualized in a responsive React HUD console."
)

# ============================================================
# CHAPTER 2: PROBLEM STATEMENT
# ============================================================
add_chapter_heading("CHAPTER 2", "PROBLEM STATEMENT")

add_sec_heading("2.1 Problem Statement")
add_body_p(
    "Checking whether a personal identifier has been exposed in a data breach normally requires the user to hand that identifier "
    "to the checking service. If the service is untrusted, compromised, or monitored by an adversary, the query itself reveals who is being "
    "investigated and what services they use. At the same time, open query interfaces that do not verify the requester's authority allow "
    "adversaries to automate mass lookups against target domains, turning defensive tools into reconnaissance engines. Finally, centralized "
    "threat repositories lack cryptographic accountability, making it impossible to prove whether an audit took place or whether historical "
    "records were tampered with."
)
add_body_p(
    "The problem addressed by this project is therefore to construct a production-ready breach-lookup platform in which:\n"
    "1. The checking service never learns the identifier being searched, preserving query confidentiality under polynomial time bounds;\n"
    "2. Only authenticated users who possess access to the target identifier can trigger searches, preventing unauthorized bot harvesting;\n"
    "3. Incident severities and phishing threats are automatically classified through machine learning;\n"
    "4. All audit log entries are cryptographically bound to an immutable blockchain ledger to prevent retrospective log modification."
)

add_sec_heading("2.2 Motivation")
add_body_p(
    "According to IBM's Cost of a Data Breach Report 2024 [1], stolen or compromised credentials remain the most pervasive initial attack "
    "vector, requiring an average of 292 days to identify and contain. Security teams need proactive warning systems to discover credentials "
    "leaked on underground forums before adversaries exploit them. However, conducting such investigations through conventional commercial "
    "APIs exposes corporate investigation targets to third-party surveillance. Resolving this tension between proactive intelligence and "
    "strict query privacy forms the core motivation of BreachShield."
)

add_sec_heading("2.3 Objectives")
add_body_p(
    "The engineering objectives formulated to solve the problem statement comprise:\n"
    "• Formulating the client-side prefix extraction and local matching protocol;\n"
    "• Designing the dual-channel OTP dispatch pipeline combining SMTP and Android WebSockets;\n"
    "• Developing the asynchronous Telegram scraper and local catalog adapters;\n"
    "• Implementing binary SHA-256 Merkle trees with on-chain Ethereum smart contract anchoring;\n"
    "• Benchmarking threat classification models on curated leak datasets."
)

# ============================================================
# CHAPTER 3: DETAILED SURVEY
# ============================================================
add_chapter_heading("CHAPTER 3", "DETAILED SURVEY")

add_body_p(
    "To establish a sound theoretical foundation, the project conducted a detailed survey of foundational literature across data privacy, "
    "cryptographic search, dark-web threat intelligence, and blockchain audit architectures. The surveyed literature includes:"
)

surveys = [
    ("[1] IBM Security (2024)", "Cost of a Data Breach Report", "Analyzed 604 organizations across 17 industries. Confirmed stolen credentials as the leading attack vector (16% of breaches, average total cost $4.88M). Emphasized the urgent necessity of automated early-detection mechanisms to shrink the identification lifecycle."),
    ("[2] L. Sweeney (2002)", "k-Anonymity: A Model for Protecting Privacy", "Formalized k-anonymity: each release of data must be indistinguishable from at least k-1 other records regarding quasi-identifiers. Provides the mathematical justification for BreachShield's 5-character prefix partitioning, where each prefix corresponds to hundreds of candidate records."),
    ("[3] L. Li, B. Pal, et al. (2019)", "Protocols for Checking Compromised Credentials", "Analyzed hash-prefix range queries used in password-checking protocols. Proved that while 5-character prefixing effectively protects high-entropy secrets, frequency-analysis attacks can target low-entropy passwords. BreachShield applies prefixing to full email/phone digests, avoiding password distribution biases."),
    ("[4] K. El Emam and F. K. Dankar (2008)", "Protecting Privacy Using k-Anonymity", "Reviewed real-world de-identification techniques, quantifying re-identification risks and equivalence class size distributions. Guided the selection of a 20-bit prefix length to maintain an optimal balance between client bandwidth and privacy guarantees."),
    ("[5] R. C. Merkle (1989)", "A Certified Digital Signature", "Introduced hierarchical binary hash trees allowing logarithmic inclusion proofs O(log N). Forms the mathematical basis of BreachShield's audit log bundling and verification pipeline."),
    ("[6] P. Grassi, M. Garcia, et al. (2020)", "NIST SP 800-63B: Digital Identity Guidelines", "Established standards for out-of-band authenticator security, rate limiting, and cryptographic salting. Directly adopted in BreachShield's 6-digit OTP engine, bcrypt hashing, and 5-attempt lockout thresholds."),
    ("[7] A. Arabnouri and S. Eissazadeh (2024)", "A Secure Auditable Log Based on Blockchain", "Evaluated periodic batching of system logs into Merkle roots anchored to blockchain smart contracts. Demonstrated that anchoring eliminates the vulnerability of single-point log manipulation while minimizing gas costs."),
    ("[8] T. Zhang (2021)", "Deep Web and Dark Web Monitoring for Threat Intelligence", "Explored challenges in automated dark-web collection, including dynamic layout changes, bot detection, and noisy paste dumps. Informed BreachShield's modular adapter pattern separating scraper collectors from normalization parsers."),
    ("[9] P. Kuhn, K. Wittorf, and C. Reuter (2024)", "Navigating the Shadows: Dark Web Threat Evaluation", "Investigated semi-automated evaluation of underground forums, showing that over 70% of forum chatter is benign noise. Supported the integration of machine learning classification to prioritize high-severity credential dumps."),
    ("[10] C. Dwork (2008)", "Differential Privacy: A Survey of Results", "Evaluated perturbation-based privacy models. While differential privacy adds noise to statistical aggregates, k-anonymity preserves exact matching required for deterministic breach detection, confirming k-anonymity as the appropriate model for BreachShield.")
]

for s_ref, s_title, s_desc in surveys:
    add_bullet_p(f"{s_ref} — {s_title}:", s_desc)

# ============================================================
# CHAPTER 4: SURVEY SUMMARY TABLE
# ============================================================
add_chapter_heading("CHAPTER 4", "SURVEY SUMMARY TABLE")

add_body_p(
    "Table 4.1 summarizes the surveyed work across primary research domains, highlighting the specific problems addressed, "
    "methodologies utilized, and key research outcomes."
)

tbl_s1 = doc.add_table(rows=7, cols=4)
tbl_s1.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Ref.", "Research Area", "Problem Addressed", "Approach and Key Result"]):
    cell = tbl_s1.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

s1_data = [
    ("[1]", "Threat Landscape", "Economic cost and containment delays of data breaches", "Empirical study of 604 organizations; stolen credentials average 292 days to contain."),
    ("[2], [4]", "Data Privacy", "Re-identification risks in released datasets", "Formalized k-anonymity equivalence class bounds; re-identification risk bounded by 1/k."),
    ("[3]", "Credential Checking", "Network privacy of breach lookup protocols", "Formal security proofs of prefix range queries; analyzed frequency attack mitigations."),
    ("[5]", "Cryptography", "Efficient verification of large datasets", "Binary hash trees with O(log N) authentication paths and cryptographic inclusion proofs."),
    ("[6]", "Authentication", "Vulnerabilities in out-of-band identity verification", "NIST guidelines for OTP salting, bcrypt cost factors, and brute-force throttling."),
    ("[7]", "Blockchain Auditing", "Tamper-resistance in enterprise audit logging", "Periodic Merkle root anchoring to distributed consensus ledgers for non-repudiation.")
]

for r_idx, (r_ref, r_area, r_prob, r_app) in enumerate(s1_data):
    cells = tbl_s1.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(r_ref).font.size = Pt(9.5)
    cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(r_area).font.size = Pt(9.5)
    cells[2].paragraphs[0].add_run(r_prob).font.size = Pt(9.5)
    cells[3].paragraphs[0].add_run(r_app).font.size = Pt(9.5)

add_p("", space_before=14, space_after=2)
add_body_p(
    "Table 4.2 presents a direct comparison between related public approaches and the architectural design choices implemented in BreachShield."
)

tbl_s2 = doc.add_table(rows=5, cols=3)
tbl_s2.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Design Dimension", "Related Public Approaches", "BreachShield Implementation"]):
    cell = tbl_s2.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

s2_data = [
    ("Query Privacy", "Plaintext email queries; prefix range queries restricted to passwords [3].", "Strict 5-char SHA-256 prefix range query applied to all identifiers; local client matching."),
    ("Audit Anchoring", "Centralized mutable relational tables [7].", "Hourly batches hashed into Merkle trees and anchored into an Ethereum smart contract."),
    ("Access Control", "Static CAPTCHA or unauthenticated search endpoints.", "Mandatory out-of-band OTP verification via SMTP email and native Android SMS Gateway."),
    ("Threat Classification", "Manual tagging or regex rule matching.", "Hybrid pipeline: deterministic rule engine + trained Random Forest and URL transformer.")
]

for r_idx, (d_dim, d_rel, d_prop) in enumerate(s2_data):
    cells = tbl_s2.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(d_dim).font.size = Pt(9.5)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(d_rel).font.size = Pt(9.5)
    cells[2].paragraphs[0].add_run(d_prop).font.size = Pt(9.5)

# ============================================================
# CHAPTER 5: SYSTEM REQUIREMENT SPECIFICATION
# ============================================================
add_chapter_heading("CHAPTER 5", "SYSTEM REQUIREMENT SPECIFICATION")

add_sec_heading("5.1 Functional Requirements")
add_body_p(
    "The functional requirements of BreachShield specify the precise operational behavior required of each subsystem, as detailed in Table 5.1."
)

tbl_fr = doc.add_table(rows=9, cols=3)
tbl_fr.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Req ID", "Feature Name", "Detailed Functional Specification"]):
    cell = tbl_fr.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

fr_specs = [
    ("FR1", "OTP Authentication", "Generate a 6-digit random OTP, hash it with bcrypt, and dispatch it via Gmail SMTP or Android SMS Gateway. Enforce a 5-minute expiry, 30s resend cooldown, and 5-attempt lockout."),
    ("FR2", "Private Search", "Compute SHA-256 in client browser, transmit only the 5-character hexadecimal prefix to /api/v1/range-query/{prefix}, download candidate records, and evaluate match locally."),
    ("FR3", "Source Dispatching", "Dispatch lookups across registered source adapters (local breach database and Telegram scraper microservice) and aggregate matching breach metadata."),
    ("FR4", "Exposure Risk Scoring", "Compute composite threat scores (0-100) based on breach severity, credential exposure type (plaintext password, hash, PII), and record recency."),
    ("FR5", "URL Classification", "Extract URLs from breach metadata and evaluate phishing probabilities using a pretrained transformer inference microservice."),
    ("FR6", "Audit Logging", "Record search audit events containing query timestamp, prefix, matched status, and source identifiers in an append-only log store."),
    ("FR7", "Merkle Root Anchoring", "Construct binary Merkle trees over audit batches and transmit root hashes to an EVM smart contract anchor via Web3 RPC."),
    ("FR8", "Proof Verification", "Generate cryptographic Merkle inclusion proofs for individual audit entries, allowing independent verification against on-chain roots.")
]

for r_idx, (r_id, r_name, r_spec) in enumerate(fr_specs):
    cells = tbl_fr.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(r_id).font.size = Pt(9.5)
    cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(r_name).font.size = Pt(9.5)
    cells[1].paragraphs[0].runs[0].font.bold = True
    cells[2].paragraphs[0].add_run(r_spec).font.size = Pt(9.5)

add_sec_heading("5.2 Non-Functional Requirements")
add_body_p(
    "Non-functional requirements establish performance benchmarks, security guarantees, and reliability constraints as shown in Table 5.2."
)

tbl_nfr = doc.add_table(rows=5, cols=3)
tbl_nfr.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Attribute", "Quality Requirement", "Target Metric / Standard"]):
    cell = tbl_nfr.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

nfr_specs = [
    ("Privacy", "Zero raw identifier transmission across network interfaces; server learns only the 5-char prefix.", "0 plaintext bytes in packets; equivalence class size k >= 500."),
    ("Integrity", "Tampering with audit logs must be mathematically detectable via Merkle proof invalidation.", "SHA-256 collision resistance; on-chain smart contract immutability."),
    ("Performance", "Sub-100 millisecond response time for range queries under standard broadband conditions.", "Range query API latency < 80ms; local client match < 5ms."),
    ("Reliability", "Continuous operation during database connection pool drops via automatic persistence fallback.", "Automatic fallback to local JSON stores; zero dropped transactions.")
]

for r_idx, (n_att, n_req, n_tar) in enumerate(nfr_specs):
    cells = tbl_nfr.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(n_att).font.size = Pt(9.5)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(n_req).font.size = Pt(9.5)
    cells[2].paragraphs[0].add_run(n_tar).font.size = Pt(9.5)

add_sec_heading("5.3 Hardware Requirements")
add_body_p(
    "Table 5.3 outlines the minimum and recommended hardware configurations for hosting and executing BreachShield."
)

tbl_hw = doc.add_table(rows=5, cols=2)
tbl_hw.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Hardware Component", "Specification Requirements"]):
    cell = tbl_hw.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

hw_specs = [
    ("Host Machine / Processor", "Intel Core i5 / AMD Ryzen 5 (Quad-Core @ 2.5 GHz or higher)"),
    ("System Memory (RAM)", "8 GB minimum; 16 GB recommended for concurrent microservices and model inference"),
    ("Storage Drive", "20 GB available SSD space (NVMe recommended for high-IOPS prefix indexing)"),
    ("Mobile Gateway Device", "Android Smartphone running Android 10.0+ with active cellular SIM for SMS relay")
]

for r_idx, (h_comp, h_spec) in enumerate(hw_specs):
    cells = tbl_hw.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(h_comp).font.size = Pt(9.5)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(h_spec).font.size = Pt(9.5)

add_sec_heading("5.4 Software Requirements")
add_body_p(
    "Table 5.4 details the operating systems, runtimes, development frameworks, and library dependencies utilized across all four tiers."
)

tbl_sw = doc.add_table(rows=7, cols=2)
tbl_sw.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Software Layer", "Environment & Library Specifications"]):
    cell = tbl_sw.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

sw_specs = [
    ("Operating System", "Microsoft Windows 11 / Linux Ubuntu 22.04 LTS"),
    ("Frontend Tier", "React 19, Tailwind CSS, Lucide Icons, Vite / Create React App, Web Crypto API"),
    ("Backend API Gateway", "Node.js v20.x, Express 5.x, JWT, bcrypt, Nodemailer, ws (WebSocket), Winston"),
    ("Scraper & ML Tier", "Python 3.11, FastAPI, Playwright, BeautifulSoup4, Scikit-Learn, PyTorch, Transformers"),
    ("Persistence Tier", "MySQL 8.0 Community Edition, JSON File Fallback Store"),
    ("Blockchain Environment", "Solidity 0.8.20 Smart Contract, Web3.js / Ethers.js v6, Hardhat / Ganache local EVM")
]

for r_idx, (s_layer, s_spec) in enumerate(sw_specs):
    cells = tbl_sw.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(s_layer).font.size = Pt(9.5)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(s_spec).font.size = Pt(9.5)

# ============================================================
# CHAPTER 6: SYSTEM DESIGN
# ============================================================
add_chapter_heading("CHAPTER 6", "SYSTEM DESIGN")

add_sec_heading("6.1 System Architecture")
add_body_p(
    "BreachShield is architected as a decoupled four-tier monorepo designed to maximize fault isolation and horizontal scalability. "
    "Figure 6.1 illustrates the architectural relationship between the React frontend, the Express API gateway, the Python scraper "
    "microservice, and the Android SMS relay gateway."
)

arch_path = os.path.join(figures_dir, 'fig_architecture.png')
add_image_box(arch_path, "Fig 6.1: System Architecture of BreachShield", width_in=5.8)

add_body_p(
    "Table 6.1 details the operational responsibilities of each architectural module depicted in Figure 6.1."
)

tbl_mod = doc.add_table(rows=7, cols=2)
tbl_mod.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Architectural Module", "Design Responsibilities"]):
    cell = tbl_mod.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

mod_specs = [
    ("Client Search Module", "Normalizes and hashes target identifiers, sends 5-character prefixes, and executes client-side suffix matching."),
    ("Authentication Module", "Generates and validates 6-digit OTPs, computes bcrypt hashes, manages cooldowns, and issues JWT session tokens."),
    ("k-Anonymity Store", "Maintains breach records indexed by 5-character hash prefixes; serves high-speed range queries."),
    ("Source Dispatcher", "Coordinates asynchronous lookups across internal breach stores and external scraper adapters."),
    ("Risk Scoring & ML Engine", "Computes composite exposure risk scores and executes URL-transformer inference on suspicious links."),
    ("Audit & Merkle Anchoring", "Constructs binary SHA-256 Merkle trees over query logs and anchors root hashes to EVM smart contracts.")
]

for r_idx, (m_name, m_resp) in enumerate(mod_specs):
    cells = tbl_mod.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(m_name).font.size = Pt(9.5)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(m_resp).font.size = Pt(9.5)

add_sec_heading("6.2 Detailed UML Design")
add_subsec_heading("6.2.1 Class Diagram")
add_body_p(
    "Figure 6.2 models the core object-oriented domain entities in the Express API Gateway, including the relations between "
    "AuthService, KAnonymityService, SourceDispatcher, MerkleTreeService, and BlockchainAnchorService."
)

class_path = os.path.join(diagrams_dir, 'class_diagram.png')
add_image_box(class_path, "Fig 6.2: UML Class Diagram of the API Gateway & Domain Entities", width_in=5.6)

add_subsec_heading("6.2.2 Activity Diagrams")
add_body_p(
    "System activities follow two primary paths: Figure 6.3 details the Out-of-Band OTP login workflow, and Figure 6.4 details the "
    "private range lookup, source dispatch, and local matching sequence."
)

add_bullet_p("Activity Workflow 1 (Fig 6.3 - OTP Login):", "User inputs email/phone -> Gateway generates OTP -> Hashes with bcrypt -> Dispatches via SMTP/SMS -> User submits OTP -> Gateway verifies token -> Issues JWT session token.")
add_bullet_p("Activity Workflow 2 (Fig 6.4 - Private Lookup):", "User enters search target -> Browser computes SHA-256 -> Extracts 5-char prefix -> Sends prefix to API -> Gateway returns matching candidate suffixes -> Browser evaluates exact match -> Computes risk score -> Displays results.")

add_subsec_heading("6.2.3 Use Case Diagram")
add_body_p(
    "Figure 6.5 illustrates the interactions between primary system actors (Analyst, Regular User, Scraper Worker) and system use cases."
)

usecase_path = os.path.join(diagrams_dir, 'usecase_diagram.png')
add_image_box(usecase_path, "Fig 6.5: Use Case Diagram Modeling Analyst & Attacker Interactions", width_in=5.6)

add_subsec_heading("6.2.4 Data Flow Diagram")
add_body_p(
    "Figure 6.6 details the Level 1 Data Flow Diagram, illustrating the movement of data between client terminals, the range-query "
    "store, the Telegram scraper, and the blockchain audit anchor."
)

dfd_path = os.path.join(diagrams_dir, 'dfd_level1.png')
add_image_box(dfd_path, "Fig 6.6: Data Flow Diagram (Level 1: OSINT Ingestion & Processing)", width_in=5.6)

# ============================================================
# CHAPTER 7: IMPLEMENTATION
# ============================================================
add_chapter_heading("CHAPTER 7", "IMPLEMENTATION")

add_sec_heading("7.1 Repository Layout")
add_body_p(
    "The BreachShield codebase is organized as a unified monorepo divided into four core subsystems:\n"
    "• frontend/: React 19 single-page application built with Vite and Tailwind CSS, containing the HUD terminal and Web Crypto logic.\n"
    "• backend/: Express 5 API gateway handling routing, bcrypt OTP verification, k-anonymity prefix querying, and Merkle tree construction.\n"
    "• scraper/: Python 3.11 FastAPI microservice running asynchronous Playwright and Telethon crawlers, hosting ML inference endpoints.\n"
    "• android-gateway/: Native Android Kotlin application implementing WebSocketOkHttpClient to relay outbound OTP tokens via cellular SMS."
)

add_sec_heading("7.2 Client-Side k-Anonymity Search")
add_body_p(
    "In src/services/kAnonymityService.js, the client normalizes target strings (lowercase, trimmed) and executes SHA-256 using the browser's "
    "native Web Crypto API. The initial 5 characters are extracted as the query prefix, and the remaining characters form the suffix. "
    "The client issues an HTTP GET request to /api/v1/range-query/{prefix}. The server queries the database index and returns an array "
    "of matching suffix records. The client then performs an in-memory binary search. Because the full hash is never transmitted, "
    "an eavesdropper on the network gains zero knowledge of the actual queried identity."
)

add_sec_heading("7.3 OTP Login and Verification")
add_body_p(
    "The authentication gateway in src/routes/authRoutes.js implements a dual-channel OTP verification protocol. When a login request is "
    "received, the server generates a cryptographically secure 6-digit integer using crypto.randomInt(100000, 999999). The token is salted "
    "and hashed with bcrypt (cost factor 10) before storage in the email_otps table. If the target is an email address, it is dispatched via "
    "Nodemailer using secure Gmail SMTP. If the target is a mobile phone number, the payload is transmitted over a persistent WebSocket "
    "connection to the Android SMS Gateway device. A 30-second cooldown timer and a 5-attempt brute-force threshold prevent credential guessing."
)

add_sec_heading("7.4 Source Dispatch and Collection")
add_body_p(
    "The SourceDispatcher module routes queries across registered intelligence adapters. The local breach store queries MySQL for known "
    "dumps. Simultaneously, the Telegram scraper adapter connects via HTTP to the Python microservice, querying live indices harvested "
    "from monitored cybersecurity channels. Each adapter returns normalized breach objects containing breach_name, breach_date, "
    "exposed_data_classes, and source_url."
)

add_sec_heading("7.5 Exposure Scoring and Machine Learning")
add_body_p(
    "When matches are detected, the exposure scoring engine computes a composite risk score (0 to 100) based on three weighted factors: "
    "(1) Credential Severity (plaintext passwords contribute 40 points, password hashes contribute 25 points, PII contributes 15 points); "
    "(2) Incident Recency (breaches within the last 12 months contribute 25 points); and (3) Source Reliability. For extracted breach URLs, "
    "a DistilBERT transformer evaluates phishing probabilities, flagging malicious links with confidence scores exceeding 0.90."
)

add_sec_heading("7.6 Audit Log and Blockchain Anchoring")
add_body_p(
    "Every search query generates an immutable audit entry recording the query timestamp, hash prefix, matched status, and client IP hash. "
    "Hourly cron jobs batch these audit entries into binary Merkle trees. Figure 7.1 depicts the Merkle tree construction pipeline, where "
    "individual leaf hashes are recursively paired until the single 32-byte Merkle root is derived. The root hash is anchored to a Solidity "
    "smart contract on an Ethereum testnet, enabling auditors to verify inclusion proofs with O(log N) complexity."
)

merkle_img = os.path.join(figures_dir, 'fig_merkle_anchoring.png')
add_image_box(merkle_img, "Fig 7.1: Merkle Tree Construction and Smart Contract Anchoring Pipeline", width_in=5.6)

add_sec_heading("7.7 Fallback Storage and Error Handling")
add_body_p(
    "To guarantee uninterrupted availability during transient database connection drops, BreachShield implements an automatic fallback "
    "persistence layer. When a database query fails, the storage abstraction layer seamlessly diverts read and write operations to encrypted "
    "local JSON stores, ensuring that search queries and audit logging continue without throwing unhandled exceptions."
)

# ============================================================
# CHAPTER 8: TESTING
# ============================================================
add_chapter_heading("CHAPTER 8", "TESTING")

add_sec_heading("8.1 Approach & Test Environment")
add_body_p(
    "Testing was conducted across three distinct tiers to ensure comprehensive quality assurance:\n"
    "• Unit Testing: Evaluated individual utility functions, cryptographic prefix slicing, bcrypt salting, and input validators in isolation.\n"
    "• Integration Testing: Verified cross-tier communication between the React frontend, Express API gateway, MySQL database, and Python scrapers.\n"
    "• Security & Privacy Auditing: Validated zero-knowledge privacy through network packet sniffing, penetration attacks, and brute-force simulations."
)
add_body_p(
    "The testing suite utilized Jest 29 and Supertest for Node.js backend testing, React Testing Library for frontend component testing, "
    "PyTest for Python scraper testing, and Wireshark for packet-level privacy verification."
)

add_sec_heading("8.2 Unit and Integration Results")
add_body_p(
    "The backend test suite achieved 100% passes across all 101 tests in 5 suites:\n"
    "• kAnonymityService.test.js: 18/18 passed (prefix slicing, range query handling, suffix matching);\n"
    "• authRoutes.test.js: 24/24 passed (OTP generation, bcrypt verification, rate limiting, token expiration);\n"
    "• merkleAudit.test.js: 22/22 passed (tree construction, leaf hashing, inclusion proof verification);\n"
    "• telegramScraper.test.js: 15/15 passed (async scraping, message parsing, error recovery);\n"
    "• riskScoringEngine.test.js: 22/22 passed (composite scoring, weight calculation, recency decay).\n"
    "The frontend component test suite passed all 50/50 tests, verifying HUD rendering, typewriter streaming, and input sanitization."
)

add_sec_heading("8.3 Security and Privacy Verification")
add_body_p(
    "Packet captures executed during live search sessions confirmed that zero plaintext identifiers or full hashes were transmitted "
    "over network interfaces. The only query parameter transmitted was the 5-character hexadecimal prefix. Penetration testing verified "
    "that unauthenticated search requests were rejected with HTTP 403 Forbidden, and brute-force testing confirmed that accounts were locked "
    "after 5 consecutive incorrect OTP attempts."
)

# ============================================================
# CHAPTER 9: TEST CASES AND RESULTS (SNAPSHOTS)
# ============================================================
add_chapter_heading("CHAPTER 9", "TEST CASES AND RESULTS (SNAPSHOTS)")

add_sec_heading("9.1 Test Cases Execution Matrix")
add_body_p(
    "Table 9.1 details the test execution matrix, describing test IDs, modules, test types (U: Unit, I: Integration, S: System), "
    "inputs, expected results, and observed outcomes. All test cases passed successfully."
)

tbl_tc = doc.add_table(rows=17, cols=6)
tbl_tc.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["TC ID", "Module", "Type", "Input / Action", "Expected Result", "Status"]):
    cell = tbl_tc.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(9)

tc_matrix = [
    ("TC-01", "Client Hashing", "U", "Email target: User@Example.com", "Normalized and hashed to exact SHA-256 digest", "PASS"),
    ("TC-02", "k-Anonymity Store", "I", "Query 5-char prefix '7A1B2'", "Returns matching candidate suffixes in <50ms", "PASS"),
    ("TC-03", "Local Matcher", "U", "Evaluate suffix match client-side", "Match identified; zero server notification", "PASS"),
    ("TC-04", "OTP Generation", "U", "Request OTP for authorized target", "6-digit OTP created; bcrypt hash stored", "PASS"),
    ("TC-05", "OTP Expiry", "U", "Submit OTP after 301 seconds", "Rejected with HTTP 401 Token Expired", "PASS"),
    ("TC-06", "OTP Lockout", "S", "5 consecutive invalid OTP attempts", "Enforce 15-minute brute-force lockout", "PASS"),
    ("TC-07", "Email Dispatch", "I", "Trigger login for corporate email", "Dispatched via SMTP in 1.18s", "PASS"),
    ("TC-08", "SMS Dispatch", "I", "Trigger login for mobile target", "Relayed to Android gateway via WS in 1.82s", "PASS"),
    ("TC-09", "Telegram Scraper", "I", "Scrape test channel dump", "Parsed 1,500 records into normalized store", "PASS"),
    ("TC-10", "Risk Scoring", "U", "Plaintext password breach record", "Severity score computed >= 70 (High)", "PASS"),
    ("TC-11", "Phishing Classifier", "U", "URL: login-auth-verify.tk", "Classified malicious with score 0.962", "PASS"),
    ("TC-12", "Merkle Construction", "U", "Batch of 10,000 query logs", "Binary Merkle tree computed in 312ms", "PASS"),
    ("TC-13", "Contract Anchoring", "S", "Anchor Merkle root to EVM", "Smart contract stores root; TX confirmed", "PASS"),
    ("TC-14", "Proof Verification", "U", "Verify single audit record proof", "Inclusion proof validates in 2.4ms", "PASS"),
    ("TC-15", "Persistence Fallback", "S", "Simulate MySQL connection drop", "Operations diverted seamlessly to local JSON", "PASS"),
    ("TC-16", "Network Sniffing", "S", "Wireshark packet trace during search", "0 bytes raw identifier leak; 5-char prefix only", "PASS")
]

for r_idx, (t_id, t_mod, t_typ, t_inp, t_exp, t_stat) in enumerate(tc_matrix):
    cells = tbl_tc.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(t_id).font.size = Pt(8.5)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(t_mod).font.size = Pt(8.5)
    cells[2].paragraphs[0].add_run(t_typ).font.size = Pt(8.5)
    cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[3].paragraphs[0].add_run(t_inp).font.size = Pt(8.5)
    cells[4].paragraphs[0].add_run(t_exp).font.size = Pt(8.5)
    cells[5].paragraphs[0].add_run(t_stat).font.size = Pt(8.5)
    cells[5].paragraphs[0].runs[0].font.bold = True
    cells[5].paragraphs[0].runs[0].font.color.rgb = RGBColor(0, 128, 0)

add_sec_heading("9.2 Machine Learning Evaluation")
add_body_p(
    "Threat classification models were evaluated on a curated ground-truth dataset comprising 50,000 breach records. "
    "Table 9.2 presents the comparative benchmarking metrics across models, and Table 9.3 breaks down per-class performance."
)

tbl_ml1 = doc.add_table(rows=5, cols=4)
tbl_ml1.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Model Architecture", "Accuracy (%)", "Macro F1", "Weighted F1"]):
    cell = tbl_ml1.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(9.5)

ml_comp = [
    ("Naive Baseline (Majority Class)", "47.1%", "0.160", "0.302"),
    ("Linear Support Vector Classifier", "93.1%", "0.928", "0.929"),
    ("DistilBERT Transformer", "98.7%", "0.986", "0.986"),
    ("Random Forest Ensemble (150 Trees)", "99.8%", "0.998", "0.998")
]
for r_idx, (m_name, m_acc, m_mf1, m_wf1) in enumerate(ml_comp):
    cells = tbl_ml1.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(m_name).font.size = Pt(9)
    if r_idx == 3: cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(m_acc).font.size = Pt(9)
    cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[2].paragraphs[0].add_run(m_mf1).font.size = Pt(9)
    cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[3].paragraphs[0].add_run(m_wf1).font.size = Pt(9)
    cells[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

add_p("", space_before=12, space_after=2)

tbl_ml2 = doc.add_table(rows=5, cols=4)
tbl_ml2.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Threat Severity Class", "Precision", "Recall", "F1-Score"]):
    cell = tbl_ml2.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(9.5)

ml_classes = [
    ("Low Severity", "0.992", "0.988", "0.990"),
    ("Medium Severity", "0.995", "0.996", "0.995"),
    ("High Severity", "0.998", "0.997", "0.997"),
    ("Critical Severity", "0.999", "0.999", "0.999")
]
for r_idx, (c_name, c_prec, c_rec, c_f1) in enumerate(ml_classes):
    cells = tbl_ml2.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(c_name).font.size = Pt(9)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(c_prec).font.size = Pt(9)
    cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[2].paragraphs[0].add_run(c_rec).font.size = Pt(9)
    cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cells[3].paragraphs[0].add_run(c_f1).font.size = Pt(9)
    cells[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

model_plot = os.path.join(figures_dir, 'fig_model_comparison.png')
add_image_box(model_plot, "Fig 9.1: Comparative Classification Accuracy Across ML Threat Models", width_in=5.4)

f1_plot = os.path.join(figures_dir, 'fig_per_class_f1.png')
add_image_box(f1_plot, "Fig 9.2: Per-Class F1-Score Breakdown for Threat Severity Classification", width_in=5.4)

add_sec_heading("9.3 System Verification Snapshots")
add_body_p(
    "To provide verifiable visual evidence of functional execution, Figures 9.3 through 9.6 capture real execution outputs across "
    "authentication, network privacy inspection, terminal test suites, and HUD result visualization."
)

snap_login = os.path.join(snapshots_dir, 'snap_login_otp.png')
add_image_box(snap_login, "Fig 9.3: Verification Snapshot: Login Page & Dual-Channel OTP Input Step", width_in=5.6)

snap_network = os.path.join(snapshots_dir, 'snap_network_k_anon.png')
add_image_box(snap_network, "Fig 9.4: Verification Snapshot: Network DevTools Range-Query Inspection (0 Plaintext Leak)", width_in=5.6)

snap_terminal = os.path.join(snapshots_dir, 'snap_test_terminal.png')
add_image_box(snap_terminal, "Fig 9.5: Verification Snapshot: Test Terminal Execution (101/101 Backend & 50/50 Frontend Tests Passed)", width_in=5.6)

snap_results = os.path.join(snapshots_dir, 'snap_results_hud.png')
add_image_box(snap_results, "Fig 9.6: Verification Snapshot: Results HUD Console & Incident Exposure Telemetry", width_in=5.6)

# ============================================================
# CONCLUSION AND FUTURE ENHANCEMENTS
# ============================================================
add_chapter_heading("CONCLUSION AND FUTURE ENHANCEMENTS", "SUMMARY OF CONTRIBUTIONS & FUTURE ROADMAP")

add_sec_heading("Conclusion")
add_body_p(
    "BreachShield demonstrates that a breach-intelligence and credential monitoring platform can deliver comprehensive threat awareness "
    "without forcing users to disclose their sensitive search targets to intermediate networks or server operators. By combining "
    "mathematically bounded k-anonymity prefix partitioning, dual-channel out-of-band authentication, asynchronous OSINT scraping, "
    "and blockchain-anchored Merkle audit logging, the platform establishes a trustworthy paradigm for proactive cyber defense. "
    "The system eliminates raw identifier disclosure, delivers sub-100 millisecond query latency across 100,000+ indexed breach entries, "
    "and provides verifiable proof of log integrity for enterprise compliance. All 16 structured test cases passed successfully, and the "
    "research outcomes have been accepted for publication in an IEEE International Conference."
)

add_sec_heading("Identified Limitations")
add_body_p(
    "In the spirit of honest scientific evaluation, several operational limitations are acknowledged in the current prototype:\n"
    "1. Range-query prefix length is currently fixed at 5 characters; extremely rare prefixes may result in smaller equivalence sets in sparse datasets;\n"
    "2. The Android SMS Gateway requires an active physical SIM card and cellular network coverage to complete SMS dispatch;\n"
    "3. Smart contract anchoring incurs transaction gas fees, requiring off-chain batching to maintain economic feasibility."
)

add_sec_heading("Future Enhancements")
add_body_p(
    "The future development roadmap for BreachShield focuses on four strategic extensions:\n"
    "• Multi-Party Computation (MPC): Implementing garbled circuits to enable private set intersection (PSI) across competing corporate databases without revealing proprietary customer lists;\n"
    "• Decentralized IPFS Storage: Distributing encrypted OSINT dump repositories across the InterPlanetary File System to eliminate single-point hosting vulnerabilities;\n"
    "• Automated SIEM / SOAR Connectors: Developing pre-configured webhooks for Splunk, Microsoft Sentinel, and Elastic SIEM to automate credential revocation workflows;\n"
    "• Local LLM Threat Attribution: Integrating quantized open-weight Large Language Models running locally to analyze hacker forum slang and attribute breaches to known APT groups."
)

# ============================================================
# BIBLIOGRAPHY
# ============================================================
doc.add_page_break()
add_p("BIBLIOGRAPHY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=18, bold=True, size=16, color=NAVY)

bib_references = [
    ("[1]", "IBM Security, \"Cost of a Data Breach Report 2024,\" IBM Corporation, Tech. Rep., Jul. 2024."),
    ("[2]", "L. Sweeney, \"k-Anonymity: A Model for Protecting Privacy,\" International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems, vol. 10, no. 5, pp. 557-570, 2002."),
    ("[3]", "L. Li, B. Pal, J. Ali, N. Sullivan, R. Chatterjee, and T. Ristenpart, \"Protocols for Checking Compromised Credentials,\" in Proc. ACM SIGSAC Conference on Computer and Communications Security (CCS), London, UK, pp. 1387-1404, 2019."),
    ("[4]", "K. El Emam and F. K. Dankar, \"Protecting Privacy Using k-Anonymity,\" Journal of the American Medical Informatics Association, vol. 15, no. 5, pp. 627-637, 2008."),
    ("[5]", "R. C. Merkle, \"A Certified Digital Signature,\" in Advances in Cryptology — CRYPTO '89, LNCS vol. 435, Springer, New York, NY, pp. 218-238, 1989."),
    ("[6]", "P. Grassi, M. Garcia, and J. Fenton, \"Digital Identity Guidelines: Authentication and Lifecycle Management,\" NIST Special Publication 800-63B, National Institute of Standards and Technology, Gaithersburg, MD, 2020."),
    ("[7]", "A. Arabnouri, S. Eissazadeh, and A. Shafieinejad, \"A Secure Auditable Log Based on Blockchain,\" Monadi, vol. 13, no. 2, pp. 45-58, 2024."),
    ("[8]", "T. Zhang, \"Deep Web and Dark Web Monitoring for Threat Intelligence,\" in Proc. IEEE European Symposium on Security and Privacy Workshops (EuroS&PW), Genoa, Italy, pp. 312-320, 2021."),
    ("[9]", "P. Kuhn, K. Wittorf, and C. Reuter, \"Navigating the Shadows: Manual and Semi-Automated Evaluation of the Dark Web for Cyber Threat Intelligence,\" IEEE Access, vol. 12, pp. 45120-45136, 2024."),
    ("[10]", "C. Dwork, \"Differential Privacy: A Survey of Results,\" in Theory and Applications of Models of Computation (TAMC), LNCS vol. 4978, Springer, Berlin, pp. 1-19, 2008."),
    ("[11]", "A. Pastor, A. Mozo, S. Gomez, and A. Gomez, \"Dark Web Threat Intelligence Mining via Deep Learning and Automated Crawlers,\" IEEE Transactions on Information Forensics and Security, vol. 17, pp. 1120-1135, 2022."),
    ("[12]", "A. M. Antonopoulos, Mastering Bitcoin: Programming the Open Blockchain, 2nd ed., O'Reilly Media, Sebastopol, CA, 2017."),
    ("[13]", "G. Wood, \"Ethereum: A Secure Decentralised Generalised Transaction Ledger,\" Ethereum Project Yellow Paper, vol. 151, pp. 1-32, 2014."),
    ("[14]", "E. Rescorla, \"The Transport Layer Security (TLS) Protocol Version 1.3,\" RFC 8446, Internet Engineering Task Force (IETF), 2018."),
    ("[15]", "RFC 7519, \"JSON Web Token (JWT),\" Internet Engineering Task Force (IETF), 2015."),
    ("[16]", "L. Breiman, \"Random Forests,\" Machine Learning, vol. 45, no. 1, pp. 5-32, 2001."),
    ("[17]", "Indian Ministry of Law and Justice, \"The Digital Personal Data Protection Act, 2023,\" The Gazette of India, Act No. 22 of 2023, Aug. 2023.")
]

for tag, ref_str in bib_references:
    p_b = doc.add_paragraph()
    p_b.paragraph_format.left_indent = Inches(0.4)
    p_b.paragraph_format.first_line_indent = Inches(-0.4)
    p_b.paragraph_format.space_before = Pt(3)
    p_b.paragraph_format.space_after = Pt(4)
    p_b.paragraph_format.line_spacing = 1.25
    r_tag = p_b.add_run(tag + "\t")
    r_tag.font.name = FONT_NAME
    r_tag.font.size = Pt(10)
    r_tag.font.bold = True
    r_ref = p_b.add_run(ref_str)
    r_ref.font.name = FONT_NAME
    r_ref.font.size = Pt(10)

# ============================================================
# CHAPTER 10: OUTCOME (RESEARCH PAPER)
# ============================================================
add_chapter_heading("CHAPTER 10", "OUTCOME (RESEARCH PAPER)")

add_sec_heading("10.1 Publication Details")
add_body_p(
    "In compliance with the mandatory academic requirements for Major Project Phase-II (BIS786) established by the Department "
    "of Information Science and Engineering, Acharya Institute of Technology, the research work embodied in this dissertation "
    "has been converted into a scientific research paper accepted for presentation and publication in an IEEE International Conference."
)

tbl_pub = doc.add_table(rows=6, cols=2)
tbl_pub.alignment = WD_TABLE_ALIGNMENT.CENTER
for c_idx, h in enumerate(["Publication Item", "Details"]):
    cell = tbl_pub.cell(0, c_idx)
    set_cell_background(cell, "F0F4F8")
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(h)
    r.font.bold = True
    r.font.size = Pt(10)

pub_items = [
    ("Paper Title", "BreachShield: A Privacy-Preserving OSINT Breach Intelligence Platform with k-Anonymous Search and Blockchain-Anchored Audit Logging"),
    ("Conference Name", "IEEE International Conference on Smart Computing, Cybersecurity, and Emerging Technologies"),
    ("Authors", "Premkumar Teli (1AY24IS407), Arvind D H (1AY24IS400), Girishkumar N M (1AY24IS404), Manoj (1AY24IS406), Prof. Sushma T. M. (Guide)"),
    ("Track / Outcome", "Cybersecurity & Data Privacy Track (COE-BIS786 Outcome)"),
    ("Review & Acceptance", "Accepted for Oral Presentation and Publication in IEEE Xplore Digital Library")
]

for r_idx, (p_item, p_val) in enumerate(pub_items):
    cells = tbl_pub.rows[r_idx + 1].cells
    cells[0].paragraphs[0].add_run(p_item).font.size = Pt(9.5)
    cells[0].paragraphs[0].runs[0].font.bold = True
    cells[1].paragraphs[0].add_run(p_val).font.size = Pt(9.5)

add_sec_heading("10.2 Conference Paper Abstract")
add_body_p(
    '"Open-Source Intelligence (OSINT) monitoring is critical for identifying compromised organizational credentials on dark web '
    'forums and public paste repositories. However, current breach-monitoring services expose sensitive plaintext queries to third-party '
    'aggregators and lack verifiable auditability. In this paper, we present BreachShield, an enterprise breach-monitoring platform that '
    'unifies k-anonymity cryptographic searching with blockchain-anchored audit trails. By transmitting only 5-character SHA-256 prefixes, '
    'BreachShield achieves zero-knowledge query privacy while sustaining sub-100ms lookup latency. Query and scraping audit logs are '
    'periodically batched into Merkle trees and anchored onto Ethereum smart contracts, guaranteeing tamper-evident auditability. '
    'An out-of-band dual-channel verification engine prevents unauthorized bot harvesting, and a Random Forest classifier achieves 99.8% '
    'precision in categorizing dark web threat feeds. Empirical results demonstrate the platform\'s cryptographic robustness, low latency, '
    'and suitability for privacy-preserving enterprise threat monitoring."'
)

# ============================================================
# APPENDIX A & APPENDIX B
# ============================================================
doc.add_page_break()
add_p("APPENDIX A: LIST OF FIGURES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=18, bold=True, size=16, color=NAVY)

for f_tag, f_desc, f_p in figures_list:
    add_bullet_p(f"{f_tag}:", f"{f_desc} (Page {f_p})")

doc.add_page_break()
add_p("APPENDIX B: LIST OF TABLES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=18, bold=True, size=16, color=NAVY)

for t_tag, t_desc, t_p in tables_list:
    add_bullet_p(f"{t_tag}:", f"{t_desc} (Page {t_p})")

# Save to all target paths
doc.save(out_final_draft_docx)
shutil.copy(out_final_draft_docx, out_final_report_docx)
shutil.copy(out_final_draft_docx, out_phase2_report_docx)

print("Saved reports successfully to:")
print(" 1.", out_final_draft_docx)
print(" 2.", out_final_report_docx)
print(" 3.", out_phase2_report_docx)
