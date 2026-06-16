@echo off
REM ============================================================
REM  OptiFlow - Windows setup. Double-click this file, or run
REM  it from the project folder in Command Prompt / PowerShell.
REM ============================================================

echo.
echo === OptiFlow setup (Windows) ===
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Install Node 20 or newer from https://nodejs.org and run this again.
  pause
  exit /b 1
)

echo Node version:
node --version
echo.

REM Remove any Mac-built dependencies / build cache that came in the zip.
if exist node_modules (
  echo Removing old node_modules (was built for a different machine)...
  rmdir /s /q node_modules
)
if exist .next (
  echo Removing old .next build cache...
  rmdir /s /q .next
)

echo.
echo Installing dependencies (this can take a few minutes)...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed. See the messages above.
  pause
  exit /b 1
)

if not exist .env.local (
  echo.
  echo [WARNING] .env.local not found. Copying .env.example to .env.local.
  echo Open .env.local and fill in MONGODB_URI, JWT_SECRET, etc.
  copy .env.example .env.local >nul
)

echo.
echo === Setup complete ===
echo Start the app with:   npm run dev
echo Then open:            http://localhost:3000
echo.
pause
