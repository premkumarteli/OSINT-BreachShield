import docx
import os, sys

sys.stdout.reconfigure(encoding='utf-8')

draft_path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Report_DRAFT.docx'
doc = docx.Document(draft_path)

print(f"Total Paragraphs: {len(doc.paragraphs)}")
print(f"Total Tables: {len(doc.tables)}")

out_path = r'C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\draft_extracted_text.txt'
with open(out_path, 'w', encoding='utf-8') as f:
    for i, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if t:
            f.write(f"P{i+1}: {t}\n\n")
    
    f.write("\n" + "="*80 + "\nTABLES:\n" + "="*80 + "\n")
    for t_idx, tbl in enumerate(doc.tables):
        f.write(f"\n--- TABLE {t_idx+1} (Rows: {len(tbl.rows)}, Cols: {len(tbl.columns)}) ---\n")
        for r_idx, row in enumerate(tbl.rows):
            row_vals = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
            f.write(f"  R{r_idx+1}: {' | '.join(row_vals)}\n")

print(f"Dumped full text to: {out_path}")
