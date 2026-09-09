@echo off
echo Stopping OSINT Project Servers
echo ===============================
echo.

echo Killing processes on ports 3000, 5000, and 8001...

REM Kill processes running on port 3000 (React frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    echo Stopping process on port 3000 (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)

REM Kill processes running on port 5000 (Node.js backend)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":5000"') do (
    echo Stopping process on port 5000 (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)

REM Kill processes running on port 8001 (Python FastAPI)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8001"') do (
    echo Stopping process on port 8001 (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)

REM Also kill any Python uvicorn processes
taskkill /f /im "python.exe" /fi "WINDOWTITLE eq OSINT Python Service*" >nul 2>&1

REM Kill any Node.js processes from our backend
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq OSINT Node Backend*" >nul 2>&1

echo.
echo All OSINT servers have been stopped.
echo.
pause