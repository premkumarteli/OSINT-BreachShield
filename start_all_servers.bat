@echo off
echo Starting OSINT Project - All Servers
echo =====================================
echo.

REM Get the current directory
set PROJECT_DIR=%~dp0
echo Project directory: %PROJECT_DIR%
echo.

REM Check if required dependencies are installed
echo Checking dependencies...

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo Dependencies check passed!
echo.

REM Start Python FastAPI service (osint_service.py) on port 8001
echo Starting Python FastAPI service...
start "OSINT Python Service" cmd /k "cd /d "%PROJECT_DIR%osint-backend" && echo Starting Python FastAPI service on port 8001... && python -m uvicorn osint_service:app --host 0.0.0.0 --port 8001 --reload"

REM Wait a moment for Python service to start
timeout /t 3 /nobreak >nul

REM Start Node.js backend (index.js) on port 5000
echo Starting Node.js backend...
start "OSINT Node Backend" cmd /k "cd /d "%PROJECT_DIR%osint-backend" && echo Starting Node.js backend on port 5000... && node index.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start React frontend on port 3000
echo Starting React frontend...
start "OSINT React Frontend" cmd /k "cd /d "%PROJECT_DIR%osint-frontend" && echo Starting React frontend on port 3000... && npm start"

echo.
echo =====================================
echo All servers are starting up!
echo.
echo Services:
echo - Python FastAPI Service: http://localhost:8001
echo - Node.js Backend API: http://localhost:5000  
echo - React Frontend: http://localhost:3000
echo.
echo Each service is running in its own terminal window.
echo Close the terminal windows to stop the respective services.
echo.
echo Press any key to exit this launcher...
pause >nul