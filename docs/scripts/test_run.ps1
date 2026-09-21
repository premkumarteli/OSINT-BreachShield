param([string]$f1 = "C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx")
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0

try {
    $w.ActivePrinter = "Microsoft Print to PDF"
    Write-Host "Testing opening $f1 ..."
    $d = $w.Documents.Open($f1, $false, $true)
    $pages = $d.ComputeStatistics(2)
    Write-Host "Pages: $pages"
    $d.Close($false)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $w.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($w) | Out-Null
}
Write-Host "Done successfully!"
