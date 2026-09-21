$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $docxPath = "C:\Users\prem\OSINT-breach-Finder-main\docs\academic\test_oxml.docx"
    $doc = $word.Documents.Open($docxPath, $false, $true)
    $pages = $doc.ComputeStatistics(2)
    Write-Host "Total Pages: $pages"
    
    # Check text on each page using GoTo wdGoToPage
    for ($p = 1; $p -le $pages; $p++) {
        $rngStart = $doc.GoTo(1, 1, $p) # 1 = wdGoToPage, 1 = wdGoToAbsolute
        $rngEnd = if ($p -lt $pages) { $doc.GoTo(1, 1, $p + 1) } else { $doc.Content.End }
        
        $pageRng = $doc.Range($rngStart.Start, $rngEnd.Start)
        $text = $pageRng.Text.Trim()
        Write-Host "--- PAGE $p (length: $($text.Length)) ---"
        if ($text.Length -gt 0) {
            Write-Host ($text.Substring(0, [Math]::Min(100, $text.Length)))
        } else {
            Write-Host "[EMPTY PAGE]"
        }
    }
    
    $doc.Close([ref]$false)
} catch {
    Write-Host "Error: $_"
} finally {
    $word.Quit()
}
