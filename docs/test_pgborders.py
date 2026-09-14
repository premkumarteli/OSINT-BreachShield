import zipfile
import xml.etree.ElementTree as ET
import os

source_path = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic/BreachShield_Progress_Report_3_DRAFT.docx'
test_path = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic/test_border.docx'

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
MC_NS = 'http://schemas.openxmlformats.org/markup-compatibility/2006'

# Read docx
with zipfile.ZipFile(source_path, 'r') as zin:
    file_contents = {}
    for item in zin.infolist():
        file_contents[item.filename] = zin.read(item.filename)

doc_xml = file_contents['word/document.xml'].decode('utf-8')
root = ET.fromstring(doc_xml)

# 1. Remove manual Graphic 13 alternate content shapes
for r in root.iter(f'{{{W_NS}}}r'):
    for child in list(r):
        xml_str = ET.tostring(child, encoding='utf-8').decode('utf-8')
        if 'Graphic 13' in xml_str or 'Graphic 1' in xml_str or 'height:744' in xml_str:
            r.remove(child)
            print('Removed manual border shape from a run')

# 2. Add native pgBorders to all sectPr
pg_borders_xml = f'''<w:pgBorders xmlns:w="{W_NS}" w:offsetFrom="page">
    <w:top w:val="double" w:sz="12" w:space="24" w:color="000000"/>
    <w:left w:val="double" w:sz="12" w:space="24" w:color="000000"/>
    <w:bottom w:val="double" w:sz="12" w:space="24" w:color="000000"/>
    <w:right w:val="double" w:sz="12" w:space="24" w:color="000000"/>
</w:pgBorders>'''
pg_borders_elem = ET.fromstring(pg_borders_xml)

for sectPr in root.iter(f'{{{W_NS}}}sectPr'):
    # Check if pgBorders already exists
    existing = sectPr.find(f'{{{W_NS}}}pgBorders')
    if existing is not None:
        sectPr.remove(existing)
    
    # Insert after pgMar if present
    pgMar = sectPr.find(f'{{{W_NS}}}pgMar')
    if pgMar is not None:
        idx = list(sectPr).index(pgMar)
        sectPr.insert(idx + 1, ET.fromstring(pg_borders_xml))
    else:
        sectPr.append(ET.fromstring(pg_borders_xml))
    print('Added native pgBorders to sectPr')

# Write back
new_doc_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
file_contents['word/document.xml'] = new_doc_xml

with zipfile.ZipFile(test_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for filename, content in file_contents.items():
        zout.writestr(filename, content)

print('Wrote test_border.docx successfully!')
