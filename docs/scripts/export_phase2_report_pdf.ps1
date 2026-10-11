Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$docx = "C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\BreachShield_Phase2_Project_Report.docx"
$pdf = "C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\BreachShield_Phase2_Project_Report.pdf"

if (Test-Path $pdf) {
    Remove-Item $pdf -Force
}

$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0

try {
    $w.ActivePrinter = "Microsoft Print to PDF"
    Write-Host "Opening $docx ..."
    $d = $w.Documents.Open($docx, $false, $true)
    $pages = $d.ComputeStatistics(2)
    Write-Host "Document Pages: $pages"
    
    Write-Host "Exporting to $pdf via ExportAsFixedFormat ..."
    $d.ExportAsFixedFormat($pdf, 17) # 17 = wdExportFormatPDF
    Write-Host "Export finished! File exists: $(Test-Path $pdf)"
    $d.Close($false)
} catch {
    Write-Host "Error during export: $_"
} finally {
    $w.Quit()
}
