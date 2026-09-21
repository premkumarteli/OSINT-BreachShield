$p = Get-CimInstance Win32_Printer -Filter "Name = 'Microsoft Print to PDF'"
Invoke-CimMethod -InputObject $p -MethodName SetDefaultPrinter
$default = Get-CimInstance Win32_Printer | Where-Object { $_.Default -eq $true }
Write-Host "New Default Printer:" $default.Name
