import os, sys
import pypdf
import docx
from docx import Document
from xml.etree import ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

temp_dir = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\temp'
print("=== FILES IN TEMPORARY FOLDER ===")
for f in os.listdir(temp_dir):
    p = os.path.join(temp_dir, f)
    print(f"  {f}: {os.path.getsize(p)} bytes")

# 1. Read Report Guidelines.pdf
guidelines_pdf = os.path.join(temp_dir, 'Report Guidelines.pdf')
if os.path.exists(guidelines_pdf):
    print("\n" + "="*50)
    print("=== 1. REPORT GUIDELINES.PDF ===")
    print("="*50)
    reader = pypdf.PdfReader(guidelines_pdf)
    print(f"Total Pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        print(f"\n--- Guidelines Page {i+1} ---")
        print(page.extract_text())

# 2. Extract strings from .doc binary files in temp
print("\n" + "="*50)
print("=== 2. TEXT & TEMPLATE STRUCTURE FROM .DOC FILES ===")
print("="*50)

import re

for doc_file in [
    'Project Work -OuterPage.doc',
    'Project Work - Inner CertificatePage.doc',
    'declaration.doc',
    'Sample_ACK and Abstract.doc',
    'Table of Contents.doc'
]:
    doc_path = os.path.join(temp_dir, doc_file)
    print(f"\n>>> File: {doc_file} ({os.path.getsize(doc_path)} bytes) <<<")
    with open(doc_path, 'rb') as f:
        content = f.read()
    
    # Try UTF-16LE text extraction (common in Word binary files)
    utf16_matches = re.findall(rb'(?:[\x20-\x7e]\x00){4,}', content)
    utf16_texts = [m.decode('utf-16le', errors='ignore').strip() for m in utf16_matches]
    
    # Also ASCII strings
    ascii_matches = re.findall(rb'[\x20-\x7e\r\n]{4,}', content)
    ascii_texts = [m.decode('ascii', errors='ignore').strip() for m in ascii_matches]
    
    # Combine unique meaningful strings
    combined = []
    for t in utf16_texts + ascii_texts:
        t = re.sub(r'\s+', ' ', t).strip()
        if len(t) > 6 and t not in combined and not t.startswith('Normal') and not t.startswith('Heading') and not t.startswith('Times'):
            combined.append(t)
            
    for line in combined[:30]:
        print("   *", line)

# 3. Inspect BreachShield_Phase2_Report_DRAFT.docx in final report folder
draft_docx = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Report_DRAFT.docx'
if os.path.exists(draft_docx):
    print("\n" + "="*50)
    print("=== 3. EXISTING DRAFT IN FINAL REPORT FOLDER ===")
    print("="*50)
    doc = Document(draft_docx)
    print(f"Sections count: {len(doc.sections)}")
    sec = doc.sections[0]
    print(f"Margins: Left={sec.left_margin.inches}in, Right={sec.right_margin.inches}in, Top={sec.top_margin.inches}in, Bottom={sec.bottom_margin.inches}in")
    print(f"Page size: {sec.page_width.inches}in x {sec.page_height.inches}in")
    print(f"Header: {[p.text for p in sec.header.paragraphs if p.text]}")
    print(f"Footer: {[p.text for p in sec.footer.paragraphs if p.text]}")
    p_borders = sec._sectPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pgBorders')
    print("Page borders XML present:", p_borders is not None)
    if p_borders is not None:
        print("  pgBorders XML:", ET.tostring(p_borders).decode('utf-8'))
    print(f"Total Paragraphs: {len(doc.paragraphs)}")
    print(f"Total Tables: {len(doc.tables)}")
    print("\nFirst 15 Paragraphs:")
    for p in doc.paragraphs[:15]:
        if p.text.strip():
            print(f"   [{p.alignment}] {p.text.strip()[:80]}")

# 4. Inspect BreachShield_Phase2_Report_DRAFT_preview.pdf
draft_pdf = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Report_DRAFT_preview.pdf'
if os.path.exists(draft_pdf):
    print("\n" + "="*50)
    print("=== 4. DRAFT PDF PREVIEW DETAILS ===")
    print("="*50)
    r = pypdf.PdfReader(draft_pdf)
    print(f"Total Pages: {len(r.pages)}")
    for p_idx in [0, 1, 2, 3, 4, 5, len(r.pages)-1]:
        if p_idx < len(r.pages):
            txt = r.pages[p_idx].extract_text()
            first = txt.split('\n')[0] if txt else 'EMPTY'
            print(f"Page {p_idx+1}: first line = \"{first[:60]}\" (total chars: {len(txt)})")
