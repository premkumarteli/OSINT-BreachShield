import docx

doc = docx.Document('c:/Users/prem/OSINT-breach-Finder-main/docs/academic/test_oxml.docx')
body = doc._body._element
tables = body.xpath('.//w:tbl')
last_tbl = tables[-1]
idx = list(body).index(last_tbl)

# Remove all paragraphs between last_tbl and the trailing sectPr
to_remove = []
for i in range(idx + 1, len(body)):
    el = body[i]
    if el.tag.endswith('p'):
        to_remove.append(el)
        
for el in to_remove:
    body.remove(el)

print(f'Removed {len(to_remove)} trailing empty paragraphs!')
doc.save('c:/Users/prem/OSINT-breach-Finder-main/docs/academic/test_oxml.docx')
