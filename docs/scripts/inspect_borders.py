import zipfile
import xml.etree.ElementTree as ET

path = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic/Netvisor_Project Work Progress Report 1.docx'
with zipfile.ZipFile(path) as z:
    doc_xml = z.read('word/document.xml').decode('utf-8')
    root = ET.fromstring(doc_xml)
    
    for i, p in enumerate(root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')):
        xml_str = ET.tostring(p, encoding='utf-8').decode('utf-8')
        if 'height:744' in xml_str or 'Graphic 13' in xml_str or 'Graphic 1' in xml_str or 'mso-position-vertical-relative:page' in xml_str:
            texts = [t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
            print(f'P{i} has page border shape! Text: {texts[:2]}')
