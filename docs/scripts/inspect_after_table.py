import docx

doc = docx.Document('c:/Users/prem/OSINT-breach-Finder-main/docs/academic/test_oxml.docx')
body = doc._body._element
tables = body.xpath('.//w:tbl')
last_tbl = tables[-1]
idx = list(body).index(last_tbl)
print(f'Last table index: {idx}, total body elements: {len(body)}')
for i in range(idx + 1, len(body)):
    el = body[i]
    tag = el.tag.split('}')[-1]
    text = ''.join(el.itertext()).strip()
    has_sectPr = el.find('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sectPr') is not None
    print(f'  {i}: <{tag}> text="{text}" has_sectPr={has_sectPr}')
