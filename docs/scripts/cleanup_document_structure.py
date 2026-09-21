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

def clean_and_format_report(filepath):
    print(f'=== Cleaning {filepath} ===')
    doc = docx.Document(filepath)
    
    # 1. Optimize line spacing & paragraph spacing
    for p in doc.paragraphs:
        t = p.text.strip()
        if t and not p.style.name.startswith('Heading') and t != 'Progress:':
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(2.5)
            p.paragraph_format.space_before = Pt(0)
            
    # Save temporary changes to docx
    doc.save(filepath)
    
    # 2. Modify XML for body elements & page borders
    with zipfile.ZipFile(filepath, 'r') as zin:
        file_contents = {item.filename: zin.read(item.filename) for item in zin.infolist()}
        
    doc_xml = file_contents['word/document.xml'].decode('utf-8')
    root = ET.fromstring(doc_xml)
    body = root.find(f'{{{W_NS}}}body')
    
    # Find position of Table 1 (second table)
    tables = body.findall(f'{{{W_NS}}}tbl')
    if len(tables) >= 2:
        t1 = tables[1]
        t1_idx = list(body).index(t1)
        
        # Remove empty paragraphs after Table 1 (except the trailing sectPr)
        elements_to_remove = []
        for el in list(body)[t1_idx + 1:]:
            tag = el.tag.split('}')[-1]
            if tag == 'p':
                text = ''.join(el.itertext()).strip()
                # If paragraph has sectPr, preserve sectPr inside body, remove paragraph
                sectPr = el.find(f'{{{W_NS}}}pPr/{{{W_NS}}}sectPr')
                if sectPr is not None:
                    # preserve sectPr at the very end of body if body doesn't have one
                    pass
                elif not text:
                    elements_to_remove.append(el)
                    
        for el in elements_to_remove:
            body.remove(el)
        print(f'  Removed {len(elements_to_remove)} trailing empty paragraphs after signatures')
        
    # Remove manual floating shapes (Graphic 13)
    removed_shapes = 0
    for r in root.iter(f'{{{W_NS}}}r'):
        for child in list(r):
            xml_str = ET.tostring(child, encoding='utf-8').decode('utf-8')
            if 'Graphic 13' in xml_str or 'Graphic 1' in xml_str or 'height:744' in xml_str:
                r.remove(child)
                removed_shapes += 1
    print(f'  Removed {removed_shapes} manual floating border shapes')
    
    # Add native double page borders to all sectPr
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
    print(f'  Added native double page borders to all {sect_count} sections')
    
    # Write back
    new_doc_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    file_contents['word/document.xml'] = new_doc_xml
    
    with zipfile.ZipFile(filepath, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for filename, content in file_contents.items():
            zout.writestr(filename, content)
            
    print(f'Successfully completed cleanup for {filepath}!\n')

academic_dir = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic'
for num in [1, 2, 3]:
    final_p = os.path.join(academic_dir, f'BreachShield_Progress_Report_{num}.docx')
    draft_p = os.path.join(academic_dir, f'BreachShield_Progress_Report_{num}_DRAFT.docx')
    for p in [final_p, draft_p]:
        if os.path.exists(p):
            try:
                clean_and_format_report(p)
            except PermissionError:
                print(f'Notice: {p} is currently locked by Word. Please close Word to update.')
