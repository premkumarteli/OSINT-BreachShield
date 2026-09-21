$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open('C:\Users\prem\OSINT-breach-Finder-main\docs\paper\conference-template-a4(2).docx')
    $doc.SaveAs2('C:\Users\prem\OSINT-breach-Finder-main\docs\paper\conference_template_std.docx', 16) # 16 = wdFormatDocumentDefault
    $doc.Close($false)
    Write-Host 'Success!'
} catch {
    Write-Host 'Error:' $_.Exception.Message
} finally {
    $word.Quit()
}
