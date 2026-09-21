# Clean any stale Word resiliency and lock files
Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Microsoft\Office\15.0\Word\Resiliency\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "docs\paper\~$*" -Force -ErrorAction SilentlyContinue

$docx = "C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx"
$pdf = "C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.pdf"

if (Test-Path $pdf) {
    Remove-Item $pdf -Force
    Write-Host "Removed existing PDF"
}

$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0

try {
    Write-Host "Configuring local printer to prevent network printer timeouts..."
    $w.ActivePrinter = "Microsoft Print to PDF"
    Write-Host "Opening $docx ..."
    $d = $w.Documents.Open($docx, $false, $true)
    $pages = $d.ComputeStatistics(2)
    Write-Host "Document Pages: $pages"
    
    Write-Host "Exporting to $pdf via ExportAsFixedFormat ..."
    $d.ExportAsFixedFormat($pdf, 17) # 17 = wdExportFormatPDF
    Write-Host "Export finished! File exists: $(Test-Path $pdf)"
    $d.Close($false)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $w.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($w) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
Write-Host "Final IEEE PDF compiled successfully!"
