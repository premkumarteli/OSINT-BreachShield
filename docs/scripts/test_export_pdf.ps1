$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $docxPath = "C:\Users\prem\OSINT-breach-Finder-main\docs\academic\test_oxml.docx"
    $pdfPath = "C:\Users\prem\OSINT-breach-Finder-main\docs\academic\test_oxml.pdf"
    $doc = $word.Documents.Open($docxPath, $false, $true)
    
    # wdExportFormatPDF = 17
    $doc.ExportAsFixedFormat($pdfPath, 17)
    Write-Host "SUCCESS: Exported to PDF: $pdfPath"
    $doc.Close([ref]$false)
} catch {
    Write-Host "Error: $_"
} finally {
    $word.Quit()
}
