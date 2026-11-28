@echo off
setlocal enabledelayedexpansion
title LineDesign - LECO Pole Selection Tool

echo ============================================================
echo   LineDesign - LECO Overhead Line Design Tool
echo ============================================================
echo.

cd /d "%~dp0"

:: ── 1. Check Python ──────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found.
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

:: ── 2. Check Node.js ─────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo Please install Node.js LTS from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: ── 3. Create Python virtual environment (first time only) ───
if not exist "backend\.venv\Scripts\python.exe" (
    echo [1/4] Creating Python environment (first time only)...
    python -m venv backend\.venv
    if errorlevel 1 (
        echo [ERROR] Failed to create Python virtual environment.
        pause
        exit /b 1
    )

    echo [2/4] Installing backend packages...
    backend\.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
    backend\.venv\Scripts\pip.exe install -r backend\requirements.txt --quiet
    if errorlevel 1 (
        echo [ERROR] Failed to install backend packages.
        pause
        exit /b 1
    )
    backend\.venv\Scripts\pip.exe install -e engine --quiet
    if errorlevel 1 (
        echo [ERROR] Failed to install engine package.
        pause
        exit /b 1
    )
)

:: ── 4. Set up database and master data (first time only) ─────
if not exist "backend\pole_select.db" (
    echo [3/4] Setting up database and importing LECO master data...
    pushd backend
    .venv\Scripts\alembic.exe upgrade head
    if errorlevel 1 (
        echo [ERROR] Database setup failed.
        popd
        pause
        exit /b 1
    )
    .venv\Scripts\python.exe -m app.importers.excel_master ..\data\source\LECO_Pole_Selection_Construction_Data.xlsx
    if errorlevel 1 (
        echo [ERROR] Master data import failed.
        popd
        pause
        exit /b 1
    )
    popd

    echo.
    echo ── Create your login account ──────────────────────────────
    set /p "ADMIN_EMAIL=Enter your email  [e.g. sir@leco.lk]: "
    if "!ADMIN_EMAIL!"=="" set "ADMIN_EMAIL=admin@linedesign.local"
    set /p "ADMIN_PASSWORD=Enter a password: "
    if "!ADMIN_PASSWORD!"=="" set "ADMIN_PASSWORD=Admin1234"

    pushd backend
    set "ADMIN_ROLE=admin"
    .venv\Scripts\python.exe -m app.cli_init_admin
    if errorlevel 1 (
        echo [ERROR] Failed to create login account.
        popd
        pause
        exit /b 1
    )
    popd

    echo.
    echo Account created! Email: !ADMIN_EMAIL!
    echo Remember this email and password to sign in.
    echo.
)

:: ── 5. Install frontend packages (first time only) ───────────
if not exist "frontend\node_modules" (
    echo [4/4] Installing frontend packages (first time only)...
    pushd frontend
    call npm install --silent
    if errorlevel 1 (
        echo [ERROR] Frontend package installation failed.
        popd
        pause
        exit /b 1
    )
    popd
)

:: ── 6. Start servers ─────────────────────────────────────────
echo.
echo Starting LineDesign...
echo.

start "LineDesign-Backend" /min cmd /c "cd /d "%~dp0backend" && .venv\Scripts\uvicorn.exe app.main:app --port 8000 2>&1"
start "LineDesign-Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev 2>&1"

echo Waiting for servers to be ready...
timeout /t 6 /nobreak >nul

start http://localhost:5173

echo.
echo ============================================================
echo   LineDesign is running at: http://localhost:5173
echo ============================================================
echo.
echo   Sign in with the email and password you just created.
echo.
echo   To STOP the app: close this window, then close the two
echo   minimised black windows labelled LineDesign-Backend
echo   and LineDesign-Frontend.
echo ============================================================
echo.
pause
