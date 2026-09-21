$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$academicDir = "C:\Users\prem\OSINT-breach-Finder-main\docs\academic"

for ($num = 1; $num -le 3; $num++) {
    $docxPath = Join-Path $academicDir "BreachShield_Progress_Report_$num.docx"
    $pdfPath = Join-Path $academicDir "BreachShield_Progress_Report_$num.pdf"
    
    try {
        Write-Host "Opening Report $num..."
        $doc = $word.Documents.Open($docxPath)
        Write-Host "Saving Report $num to $pdfPath..."
        $doc.SaveAs2($pdfPath, 17) # 17 = wdFormatPDF
        Write-Host "Successfully saved Report $num PDF!"
        $doc.Close($false)
    } catch {
        Write-Host "Error Report ${num}: $_"
    }
}

$word.Quit()
Write-Host "All conversions completed!"
