@echo off
title GitHub Profile Inspector
cd /d "%~dp0"

echo ========================================================
echo   GitHub Profile Inspector - Environment & Launcher
echo ========================================================

IF EXIST ".venv\Scripts\activate.bat" (
    echo [OK] Activating virtual environment (.venv)...
    call .venv\Scripts\activate.bat
    python server.py %*
) ELSE (
    echo [!] Virtual environment not found. Running with uv...
    uv run python server.py %*
)

pause
