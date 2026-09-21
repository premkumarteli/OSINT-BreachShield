$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $docxPath = "C:\Users\prem\OSINT-breach-Finder-main\docs\academic\test_oxml.docx"
    $doc = $word.Documents.Open($docxPath, $false, $true)
    $pages = $doc.ComputeStatistics(2)
    Write-Host "SUCCESS: test_oxml.docx opened in Word cleanly! Total Pages: $pages"
    $doc.Close([ref]$false)
} catch {
    Write-Host "Error: $_"
} finally {
    $word.Quit()
}
