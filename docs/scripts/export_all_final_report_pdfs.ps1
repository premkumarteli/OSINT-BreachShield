Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$docx = "C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Project_Report.docx"
$pdf1 = "C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Project_Report.pdf"
$pdf2 = "C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\final report\BreachShield_Phase2_Report_DRAFT_preview.pdf"
$pdf3 = "C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\BreachShield_Phase2_Project_Report.pdf"

$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0

try {
    Write-Host "Opening $docx ..."
    $d = $w.Documents.Open($docx, $false, $true)
    $pages = $d.ComputeStatistics(2)
    Write-Host "Document Pages: $pages"
    
    Write-Host "Exporting to $pdf1 ..."
    $d.ExportAsFixedFormat($pdf1, 17)
    
    $d.Close($false)
    Write-Host "Export finished! Copying to preview and Phase2 folder..."
    
    Copy-Item $pdf1 $pdf2 -Force
    Copy-Item $pdf1 $pdf3 -Force
    Write-Host "All PDFs successfully updated! File exists: $(Test-Path $pdf1), $(Test-Path $pdf2), $(Test-Path $pdf3)"
} catch {
    Write-Host "Error during export: $_"
} finally {
    $w.Quit()
}
