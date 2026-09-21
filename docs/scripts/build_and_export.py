import subprocess, sys, os, time
import pypdf

# 1. Kill any existing Word processes
subprocess.run(["taskkill", "/F", "/IM", "WINWORD.EXE"], capture_output=True)
subprocess.run(["powershell", "-Command", 'Remove-Item -Path "docs/paper/~$*" -Force -ErrorAction SilentlyContinue'], capture_output=True)
time.sleep(1)

# 2. Build the ground truth document
print("Step 1: Assembling BreachShield_IEEE_Paper.docx ...")
res_build = subprocess.run([sys.executable, "docs/scripts/build_ground_truth_ieee_paper.py"], capture_output=True, text=True)
print(res_build.stdout)
if res_build.returncode != 0:
    print("Build error:", res_build.stderr)
    sys.exit(1)

# 3. Export to PDF via PowerShell
print("Step 2: Exporting to BreachShield_IEEE_Paper.pdf via Word COM ...")
res_export = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "docs/scripts/export_final_ieee_pdf.ps1"], capture_output=True, text=True, timeout=60)
print(res_export.stdout)
if res_export.returncode != 0:
    print("Export error:", res_export.stderr)
    sys.exit(1)

# 4. Verify PDF
pdf_path = "docs/paper/BreachShield_IEEE_Paper.pdf"
if not os.path.exists(pdf_path):
    print("PDF does not exist!")
    sys.exit(1)

reader = pypdf.PdfReader(pdf_path)
num_pages = len(reader.pages)
print(f"Step 3: Verification complete! Total PDF pages = {num_pages}")
for i, page in enumerate(reader.pages):
    txt = page.extract_text() or ""
    print(f"Page {i+1}: {len(txt)} chars")

if 7 <= num_pages <= 9:
    print(f"SUCCESS: Paper length of {num_pages} pages strictly satisfies IEEE conference requirements (7 to 9 pages)!")
else:
    print(f"WARNING: Page count {num_pages} is outside 7-9 pages target.")
