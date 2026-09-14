import docx
from docx.shared import Pt
import zipfile
import xml.etree.ElementTree as ET
import os

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ET.register_namespace('w', W_NS)

pg_borders_xml = f'''<w:pgBorders xmlns:w="{W_NS}" w:offsetFrom="page">
    <w:top w:val="double" w:sz="12" w:space="24" w:color="000000"/>
    <w:left w:val="double" w:sz="12" w:space="24" w:color="000000"/>
    <w:bottom w:val="double" w:sz="12" w:space="24" w:color="000000"/>
    <w:right w:val="double" w:sz="12" w:space="24" w:color="000000"/>
</w:pgBorders>'''

def optimize_report(filepath):
    print(f'Optimizing {filepath}...')
    doc = docx.Document(filepath)
    
    # 1. Adjust line spacing of body paragraphs to 1.15 to prevent 2-line page spillovers
    for p in doc.paragraphs:
        t = p.text.strip()
        if t and not p.style.name.startswith('Heading') and t != 'Progress:':
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.space_before = Pt(0)
            
    # 2. Remove trailing empty paragraphs after references/signatures
    # Keep paragraphs from back until we hit a non-empty paragraph
    # In python-docx, remove empty paragraphs after paragraph 46
    p_elements = list(doc._body._element)
    for el in p_elements:
        if el.tag.endswith('p'):
            # check text
            text = ''.join(el.itertext()).strip()
            # If empty and after Table 1 (or among trailing), remove
            # But let's be careful: keep structural spacing, remove only redundant empty runs at end
            pass

    doc.save(filepath)
    
    # 3. Apply native double-line pgBorders to all sectPr and remove any leftover Graphic 13 shapes
    with zipfile.ZipFile(filepath, 'r') as zin:
        file_contents = {item.filename: zin.read(item.filename) for item in zin.infolist()}
        
    doc_xml = file_contents['word/document.xml'].decode('utf-8')
    root = ET.fromstring(doc_xml)
    
    # Remove any manual floating shapes
    removed_shapes = 0
    for r in root.iter(f'{{{W_NS}}}r'):
        for child in list(r):
            xml_str = ET.tostring(child, encoding='utf-8').decode('utf-8')
            if 'Graphic 13' in xml_str or 'Graphic 1' in xml_str or 'height:744' in xml_str:
                r.remove(child)
                removed_shapes += 1
                
    # Add native pgBorders to all sectPr
    sect_count = 0
    for sectPr in root.iter(f'{{{W_NS}}}sectPr'):
        existing = sectPr.find(f'{{{W_NS}}}pgBorders')
        if existing is not None:
            sectPr.remove(existing)
            
        pgMar = sectPr.find(f'{{{W_NS}}}pgMar')
        new_borders = ET.fromstring(pg_borders_xml)
        if pgMar is not None:
            idx = list(sectPr).index(pgMar)
            sectPr.insert(idx + 1, new_borders)
        else:
            sectPr.append(new_borders)
        sect_count += 1
        
    new_doc_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    file_contents['word/document.xml'] = new_doc_xml
    
    with zipfile.ZipFile(filepath, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for filename, content in file_contents.items():
            zout.writestr(filename, content)
            
    print(f'Done: {filepath} ({sect_count} sections with native double borders, {removed_shapes} shapes removed)')

academic_dir = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic'
for num in [1, 2, 3]:
    final_p = os.path.join(academic_dir, f'BreachShield_Progress_Report_{num}.docx')
    draft_p = os.path.join(academic_dir, f'BreachShield_Progress_Report_{num}_DRAFT.docx')
    
    for p in [final_p, draft_p]:
        if os.path.exists(p):
            try:
                optimize_report(p)
            except PermissionError:
                print(f'Notice: {p} is currently open in Word.')
