$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0

$docx = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx'
try {
    $d = $w.Documents.Open($docx, $false, $true)
    $pages = $d.ComputeStatistics(2)
    Write-Host "Total Pages: $pages"
    $d.Close($false)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $w.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($w) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
