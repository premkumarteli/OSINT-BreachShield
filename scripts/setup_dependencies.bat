@echo off
echo OSINT Project - Quick Development Setup
echo =======================================
echo.
echo This will install dependencies for both frontend and backend
echo.

set PROJECT_DIR=%~dp0

echo Installing backend Node.js dependencies...
cd /d "%PROJECT_DIR%osint-backend"
call npm install

echo.
echo Installing Python dependencies...
if exist ".venv" (
    echo Virtual environment already exists, activating...
    call .venv\Scripts\activate.bat
) else (
    echo Creating Python virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
)

pip install -r requirements.txt

echo.
echo Installing frontend React dependencies...
cd /d "%PROJECT_DIR%osint-frontend"
call npm install

echo.
echo =======================================
echo Setup complete! 
echo.
echo You can now run 'start_all_servers.bat' to start all services.
echo.
pause