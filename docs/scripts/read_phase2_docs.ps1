$files = Get-ChildItem "C:\Users\prem\OSINT-breach-Finder-main\docs\Phase2\*.doc"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    foreach ($f in $files) {
        $doc = $word.Documents.Open($f.FullName)
        Write-Output "============================="
        Write-Output $f.Name
        Write-Output "============================="
        Write-Output $doc.Content.Text
        $doc.Close([ref]$false)
    }
} finally {
    $word.Quit()
}
