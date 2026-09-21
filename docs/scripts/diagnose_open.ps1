$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
$docx = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx'
try {
    Write-Host "Opening with OpenAndRepair..."
    $d = $w.Documents.Open($docx, $false, $true, $false, [Type]::Missing, [Type]::Missing, [Type]::Missing, [Type]::Missing, [Type]::Missing, [Type]::Missing, [Type]::Missing, $false, $true)
    Write-Host "Success! Pages: " $d.ComputeStatistics(2)
    $pdf = 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.pdf'
    Write-Host "Exporting to PDF: $pdf"
    $d.SaveAs2($pdf, 17)
    Write-Host "PDF exported successfully!"
    $d.Close($false)
} catch {
    Write-Host "Exception: $($_.Exception.Message)"
} finally {
    $w.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($w) | Out-Null
}
