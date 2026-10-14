@echo off
title Allow BreachShield Port 5000 in Windows Firewall
echo ================================================================
echo    BREACHSHIELD - ALLOW PORT 5000 IN WINDOWS DEFENDER FIREWALL
echo ================================================================
echo.
echo Requesting administrator privileges...

net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Elevating to administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Adding inbound firewall rule for TCP port 5000...
netsh advfirewall firewall delete rule name="BreachShield Backend 5000" >nul 2>&1
netsh advfirewall firewall add rule name="BreachShield Backend 5000" dir=in action=allow protocol=TCP localport=5000 profile=any
echo.
if %errorLevel% EQU 0 (
    echo [SUCCESS] Port 5000 is now OPEN in Windows Firewall!
    echo Your Android phone can now connect to http://10.159.169.96:5000
) else (
    echo [ERROR] Failed to add firewall rule. Please right-click this file and choose 'Run as administrator'.
)
echo.
pause
