import os
import shutil
import glob

base = r'C:\Users\prem\OSINT-breach-Finder-main\docs'

# Target structure
dirs = [
    os.path.join(base, 'scripts'),
    os.path.join(base, 'specifications'),
    os.path.join(base, 'diagrams'),
    os.path.join(base, 'academic', 'reports'),
    os.path.join(base, 'academic', 'presentations'),
    os.path.join(base, 'academic', 'reference'),
    os.path.join(base, 'paper', 'figures'),
    os.path.join(base, 'paper', 'templates'),
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

# 1. Move specifications from docs/ root to docs/specifications/
spec_files = [
    'PROJECT.md',
    'SERVER_MANAGEMENT.md',
    'TEST_INFRA.md',
    'TEST_READY.md',
    'ORIGINAL_REQUEST.md'
]
for f in spec_files:
    src = os.path.join(base, f)
    dst = os.path.join(base, 'specifications', f)
    if os.path.exists(src):
        shutil.move(src, dst)
        print(f"Moved spec: {f}")

# 2. Move Python and PowerShell scripts from docs/ root and docs/paper/ to docs/scripts/
for f in os.listdir(base):
    if f.endswith('.py') or f.endswith('.ps1'):
        if f != 'reorganize_docs.py':
            src = os.path.join(base, f)
            dst = os.path.join(base, 'scripts', f)
            shutil.move(src, dst)
            print(f"Moved script to docs/scripts/: {f}")

paper_dir = os.path.join(base, 'paper')
for f in os.listdir(paper_dir):
    if f.endswith('.py') or f.endswith('.ps1'):
        src = os.path.join(paper_dir, f)
        dst = os.path.join(base, 'scripts', f)
        shutil.move(src, dst)
        print(f"Moved paper script to docs/scripts/: {f}")

# 3. Move templates and zips in docs/paper/ to docs/paper/templates/
template_files = [
    'conference-latex-template(2).zip',
    'conference-template-a4(2).docx',
    'conference_template_std.docx',
    'IEEEtranBST2.zip',
    'test_clean.docx'
]
for f in template_files:
    src = os.path.join(paper_dir, f)
    dst = os.path.join(paper_dir, 'templates', f)
    if os.path.exists(src):
        shutil.move(src, dst)
        print(f"Moved template: {f}")

# Remove obsolete/redundant paper directories like newp and latex
latex_redundant = os.path.join(paper_dir, 'latex')
if os.path.exists(latex_redundant):
    shutil.rmtree(latex_redundant, ignore_errors=True)
    print("Cleaned up redundant docs/paper/latex")

newp_redundant = os.path.join(paper_dir, 'newp')
if os.path.exists(newp_redundant):
    shutil.rmtree(newp_redundant, ignore_errors=True)
    print("Cleaned up redundant docs/paper/newp")

# 4. Clean up docs/academic/
acad_dir = os.path.join(base, 'academic')

# Move progress reports
for f in os.listdir(acad_dir):
    if f.startswith('BreachShield_Progress_Report_') and (f.endswith('.docx') or f.endswith('.pdf')):
        if '_DRAFT' not in f:
            src = os.path.join(acad_dir, f)
            dst = os.path.join(acad_dir, 'reports', f)
            shutil.move(src, dst)
            print(f"Moved report: {f}")

# Move presentations
for f in os.listdir(acad_dir):
    if f.endswith('.pptx'):
        src = os.path.join(acad_dir, f)
        dst = os.path.join(acad_dir, 'presentations', f)
        shutil.move(src, dst)
        print(f"Moved presentation: {f}")

# Move reference files (Phase 1, Netvisor, Evaluation sheet)
ref_files = [
    '1_Evalution Sheet-2026-2027.pdf',
    'Netvisor_Project Work Progress Report 1.docx',
    'Phase1Report2.pdf'
]
for f in ref_files:
    src = os.path.join(acad_dir, f)
    dst = os.path.join(acad_dir, 'reference', f)
    if os.path.exists(src):
        shutil.move(src, dst)
        print(f"Moved reference: {f}")

# Clean draft/scratch files in academic
scratch_acad = [
    'test_border.docx',
    'test_oxml.docx',
    'test_oxml.pdf',
    'BreachShield_Progress_Report_1_DRAFT.docx',
    'BreachShield_Progress_Report_2_DRAFT.docx',
    'BreachShield_Progress_Report_3_DRAFT.docx'
]
for f in scratch_acad:
    p = os.path.join(acad_dir, f)
    if os.path.exists(p):
        os.remove(p)
        print(f"Removed temp scratch: {f}")

# 5. Clean up redundant docs/reports folder
reports_redundant = os.path.join(base, 'reports')
if os.path.exists(reports_redundant):
    # Copy any non-duplicate files or move to academic/reports
    for f in os.listdir(reports_redundant):
        src = os.path.join(reports_redundant, f)
        dst = os.path.join(acad_dir, 'reports', f)
        if not os.path.exists(dst):
            shutil.move(src, dst)
    shutil.rmtree(reports_redundant, ignore_errors=True)
    print("Cleaned up redundant docs/reports")

# Clean __pycache__ in base and docs
for pyc in glob.glob(os.path.join(base, '**', '__pycache__'), recursive=True):
    shutil.rmtree(pyc, ignore_errors=True)
    print(f"Removed pycache: {pyc}")

# Also move project-logbook.md if at docs root
p_log = os.path.join(base, 'project-logbook.md')
if os.path.exists(p_log):
    dst = os.path.join(acad_dir, 'BreachShield_Project_Logbook.md')
    if not os.path.exists(dst):
        shutil.move(p_log, dst)
    else:
        os.remove(p_log)
    print("Cleaned duplicate project-logbook.md at docs root")

print("Docs folder restructuring completed successfully!")
