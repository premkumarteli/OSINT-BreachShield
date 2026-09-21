$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$files = @(
    @{ docx = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx'; pdf = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.pdf' },
    @{ docx = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\newp\OSINT-BreachShield_Paper_Draft.docx'; pdf = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\newp\OSINT-BreachShield_Paper_Draft.pdf' }
)

foreach ($f in $files) {
    try {
        Write-Host "Converting $($f.docx) ..."
        $doc = $word.Documents.Open($f.docx)
        $doc.SaveAs2($f.pdf, 17)
        $doc.Close($false)
        Write-Host "Saved PDF: $($f.pdf)"
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
$word.Quit()
Write-Host "All conversions complete!"
