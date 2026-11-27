@echo off
setlocal enabledelayedexpansion
title LineDesign - Automatic Setup & Launcher

echo ============================================================
echo   LineDesign (LECO Pole Selection Tool) - Quick Launcher
echo ============================================================
echo.

cd /d "%~dp0"

:: 1. Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: 2. Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)

:: 3. First-time Backend Setup
if not exist "backend\.venv\Scripts\python.exe" (
    echo [1/4] Creating Python environment...
    python -m venv backend\.venv
    if errorlevel 1 (
        echo [ERROR] Failed to create Python virtual environment.
        pause
        exit /b 1
    )

    echo [2/4] Installing backend and engineering engine packages...
    backend\.venv\Scripts\python.exe -m pip install --upgrade pip >nul
    backend\.venv\Scripts\pip.exe install -r backend\requirements.txt
    backend\.venv\Scripts\pip.exe install -e engine
)

:: 4. First-time Database & Master Data Setup
if not exist "backend\pole_select.db" (
    echo [3/4] Setting up local database and importing LECO master data...
    pushd backend
    .venv\Scripts\alembic.exe upgrade head
    .venv\Scripts\python.exe -m app.importers.excel_master ..\data\source\LECO_Pole_Selection_Construction_Data.xlsx
    echo.
    echo Create your login account to sign in to LineDesign:
    set /p "ADMIN_EMAIL=Enter email [default: reviewer@linedesign.local]: "
    if "!ADMIN_EMAIL!"=="" set "ADMIN_EMAIL=reviewer@linedesign.local"
    set /p "ADMIN_PASSWORD=Enter a password for !ADMIN_EMAIL!: "
    set "ADMIN_ROLE=reviewer"
    .venv\Scripts\python.exe -m app.cli_init_admin
    popd
)

:: 5. First-time Frontend Setup
if not exist "frontend\node_modules" (
    echo [4/4] Installing frontend packages (first run only)...
    pushd frontend
    call npm install
    popd
)

:: 6. Start Backend & Frontend and open browser
echo.
echo Starting LineDesign Backend (port 8000) and Frontend (port 5173)...
start "LineDesign Backend" /min cmd /c "cd /d "%~dp0backend" && .venv\Scripts\uvicorn.exe app.main:app --port 8000"
start "LineDesign Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo Waiting for servers to start...
timeout /t 4 /nobreak >nul

start http://localhost:5173

echo.
echo LineDesign is now running at http://localhost:5173
echo Close the two minimized "LineDesign" terminal windows when you are finished.
echo.
pause
