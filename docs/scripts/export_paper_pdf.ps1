$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $docx = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx'
    $pdf = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.pdf'
    Write-Host 'Opening document...'
    $doc = $word.Documents.Open($docx)
    Write-Host 'Exporting to PDF...'
    $doc.SaveAs2($pdf, 17) # 17 = wdFormatPDF
    $doc.Close($false)
    Write-Host 'PDF generated successfully at:' $pdf
} catch {
    Write-Host 'Error:' $_.Exception.Message
} finally {
    $word.Quit()
}
