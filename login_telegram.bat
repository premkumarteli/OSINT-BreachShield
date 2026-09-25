@echo off
title BreachShield - Telegram Account Setup
echo ================================================================
echo       OSINT BREACHSHIELD - TELEGRAM AUTHENTICATION
echo ================================================================
echo Target Number: In .env (TG_PHONE)
echo.

set PYTHON_BIN=backend\.venv\Scripts\python.exe
if not exist "%PYTHON_BIN%" set PYTHON_BIN=python

"%PYTHON_BIN%" scraper\login_telegram.py

echo.
pause
