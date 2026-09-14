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

def fix_document_borders(doc_path):
    print(f'Processing {doc_path}...')
    if not os.path.exists(doc_path):
        print(f'File not found: {doc_path}')
        return
        
    with zipfile.ZipFile(doc_path, 'r') as zin:
        file_contents = {}
        for item in zin.infolist():
            file_contents[item.filename] = zin.read(item.filename)
            
    doc_xml = file_contents['word/document.xml'].decode('utf-8')
    root = ET.fromstring(doc_xml)
    
    # 1. Remove manual floating Graphic 13 shapes
    removed_shapes = 0
    for r in root.iter(f'{{{W_NS}}}r'):
        for child in list(r):
            xml_str = ET.tostring(child, encoding='utf-8').decode('utf-8')
            if 'Graphic 13' in xml_str or 'Graphic 1' in xml_str or 'height:744' in xml_str:
                r.remove(child)
                removed_shapes += 1
    print(f'  Removed {removed_shapes} manual floating border shapes')
    
    # 2. Add native pgBorders to all sectPr elements
    sect_count = 0
    for sectPr in root.iter(f'{{{W_NS}}}sectPr'):
        # remove existing if any
        existing = sectPr.find(f'{{{W_NS}}}pgBorders')
        if existing is not None:
            sectPr.remove(existing)
            
        # Insert after pgMar
        pgMar = sectPr.find(f'{{{W_NS}}}pgMar')
        new_borders = ET.fromstring(pg_borders_xml)
        if pgMar is not None:
            idx = list(sectPr).index(pgMar)
            sectPr.insert(idx + 1, new_borders)
        else:
            sectPr.append(new_borders)
        sect_count += 1
    print(f'  Added native pgBorders to all {sect_count} sections')
    
    # Write back
    new_doc_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    file_contents['word/document.xml'] = new_doc_xml
    
    with zipfile.ZipFile(doc_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for filename, content in file_contents.items():
            zout.writestr(filename, content)
            
    print(f'Successfully updated borders in {doc_path}!')

# Fix all BreachShield reports
academic_dir = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic'
for num in [1, 2, 3]:
    final_p = os.path.join(academic_dir, f'BreachShield_Progress_Report_{num}.docx')
    draft_p = os.path.join(academic_dir, f'BreachShield_Progress_Report_{num}_DRAFT.docx')
    
    for p in [final_p, draft_p]:
        if os.path.exists(p):
            try:
                fix_document_borders(p)
            except PermissionError:
                print(f'Notice: {p} is currently open in Word. Please close Word to update this file.')
