import docx

doc = docx.Document('c:/Users/prem/OSINT-breach-Finder-main/docs/academic/BreachShield_Progress_Report_3.docx')
body = doc._body._element
for i, el in enumerate(body):
    tag = el.tag.split('}')[-1]
    text = ''.join(el.itertext()).strip()[:40]
    if tag == 'tbl' or text:
        print(f'{i}: <{tag}> {text}')
