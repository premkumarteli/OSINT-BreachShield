$p = Start-Process 'C:\PROGRA~2\MICROS~2\Office15\WINWORD.EXE' -ArgumentList 'C:\Users\prem\OSINT-breach-Finder-main\docs\paper\BreachShield_IEEE_Paper.docx' -PassThru
Start-Sleep -Seconds 3
Get-Process -Id $p.Id | Format-List Id, MainWindowTitle, Responding
Stop-Process -Id $p.Id -Force
