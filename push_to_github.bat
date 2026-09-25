@echo off
title Push to GitHub - BreachShield
echo ================================================================
echo       OSINT BREACHSHIELD - PUSH TO GITHUB MAIN
echo ================================================================
echo.

set GIT_BIN="C:\Users\prem\AppData\Local\Programs\Git\cmd\git.exe"
if not exist %GIT_BIN% set GIT_BIN=git

echo [1/2] Pushing to breachshield/main...
%GIT_BIN% push breachshield main
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Pushed to breachshield/main!
) else (
    echo [NOTE] breachshield remote push status: %ERRORLEVEL%
)

echo.
echo [2/2] Pushing to origin/main...
%GIT_BIN% push origin main
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Pushed to origin/main!
) else (
    echo [NOTE] origin remote push status: %ERRORLEVEL%
)

echo.
echo ================================================================
echo All push operations complete.
echo ================================================================
pause
