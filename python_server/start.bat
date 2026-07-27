@echo off
REM ToolKit Local AI Server - Setup & Start (Windows)
REM This server provides free-forever AI inference for all ToolKit features.
REM No API keys needed. No usage limits. Runs entirely on your machine.

echo ===================================
echo  ToolKit Local AI Server
echo  Free-forever AI inference
echo ===================================
echo.

cd /d "%~dp0"

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Python is required. Install it from https://python.org/downloads
    pause
    exit /b 1
)

REM Use short venv path to avoid Windows 260-char path limit with torch packages
set VENV_PATH=C:\tk-ai

if not exist "%VENV_PATH%\Scripts\python.exe" (
    echo Creating Python virtual environment at %VENV_PATH%...
    python -m venv %VENV_PATH%
    %VENV_PATH%\Scripts\python.exe -m ensurepip --upgrade
    %VENV_PATH%\Scripts\python.exe -m pip install --upgrade pip
)

REM Install dependencies
echo Checking dependencies...
%VENV_PATH%\Scripts\python.exe -m pip install -r requirements.txt -q 2>nul

echo.
echo Starting server on http://localhost:8400
echo Press Ctrl+C to stop
echo.

REM Start server
%VENV_PATH%\Scripts\python.exe server.py
