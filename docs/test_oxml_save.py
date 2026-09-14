import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

template_path = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic/Netvisor_Project Work Progress Report 1.docx'
test_out = 'c:/Users/prem/OSINT-breach-Finder-main/docs/academic/test_oxml.docx'

doc = docx.Document(template_path)

for section in doc.sections:
    sectPr = section._sectPr
    # check existing pgBorders
    existing = sectPr.find(docx.oxml.ns.qn('w:pgBorders'))
    if existing is not None:
        sectPr.remove(existing)
        
    pg_borders = parse_xml(
        r'<w:pgBorders %s w:offsetFrom="page">'
        r'  <w:top w:val="double" w:sz="12" w:space="24" w:color="000000"/>'
        r'  <w:left w:val="double" w:sz="12" w:space="24" w:color="000000"/>'
        r'  <w:bottom w:val="double" w:sz="12" w:space="24" w:color="000000"/>'
        r'  <w:right w:val="double" w:sz="12" w:space="24" w:color="000000"/>'
        r'</w:pgBorders>' % nsdecls('w')
    )
    sectPr.append(pg_borders)

doc.save(test_out)
print('Saved test_oxml.docx with python-docx oxml!')
