$word = New-Object -ComObject Word.Application
$word.Visible = $false

$academicDir = "C:\Users\prem\OSINT-breach-Finder-main\docs\academic"

try {
    for ($num = 1; $num -le 3; $num++) {
        $docxPath = Join-Path $academicDir "BreachShield_Progress_Report_$num.docx"
        $pdfPath = Join-Path $academicDir "BreachShield_Progress_Report_$num.pdf"
        
        Write-Host "Opening $docxPath..."
        $doc = $word.Documents.Open($docxPath, $false, $true)
        $pages = $doc.ComputeStatistics(2)
        Write-Host "Report $num has $pages pages."
        
        Write-Host "Exporting to $pdfPath..."
        # 17 = wdExportFormatPDF
        $doc.ExportAsFixedFormat($pdfPath, 17)
        Write-Host "SUCCESS: Exported Report $num to $pdfPath`n"
        
        $doc.Close([ref]$false)
    }
} catch {
    Write-Host "Error during export: $_"
} finally {
    $word.Quit()
}
