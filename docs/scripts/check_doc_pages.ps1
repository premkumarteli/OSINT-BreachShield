$word = New-Object -ComObject Word.Application
$word.Visible = $false

$academicDir = "C:\Users\prem\OSINT-breach-Finder-main\docs\academic"

for ($num = 1; $num -le 3; $num++) {
    $docxPath = Join-Path $academicDir "BreachShield_Progress_Report_$num.docx"
    $doc = $word.Documents.Open($docxPath, $false, $true) # ReadOnly
    
    # Force pagination
    $pages = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    Write-Host "Report $num ($docxPath): $pages pages"
    $doc.Close([ref]$false)
}

$word.Quit()
