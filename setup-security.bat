@echo off
REM Security Improvements - Quick Setup Script
REM Run this from the project root directory

echo ============================================
echo OptiFlow Security Improvements Setup
echo ============================================
echo.

REM Check if .env.local exists
if exist .env.local (
    echo [INFO] .env.local already exists
    echo [WARNING] Please verify it has all required variables
    echo.
) else (
    echo [INFO] Creating .env.local from template...
    copy .env.example .env.local
    echo [SUCCESS] .env.local created
    echo [ACTION REQUIRED] Edit .env.local and add your secrets
    echo.
)

REM Replace login route
echo [INFO] Checking login route...
if exist src\app\api\auth\login\route.new.js (
    echo [INFO] Found updated login route
    choice /M "Replace src\app\api\auth\login\route.js with the secure version?"
    if errorlevel 2 goto skip_login
    if errorlevel 1 (
        move /Y src\app\api\auth\login\route.js src\app\api\auth\login\route.backup.js
        move /Y src\app\api\auth\login\route.new.js src\app\api\auth\login\route.js
        echo [SUCCESS] Login route updated! Backup saved as route.backup.js
        echo.
    )
) else (
    echo [WARNING] route.new.js not found - skip this step
    echo.
)
:skip_login

REM Check for required environment variables
echo [INFO] Verifying environment setup...
echo.
echo Required environment variables:
echo   - JWT_SECRET
echo   - ADMIN_SECRET  
echo   - GEMINI_API_KEY
echo   - MONGODB_URI
echo.

REM Check if OpenSSL is available for generating secrets
where openssl >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] OpenSSL is available for generating secrets
    echo.
    choice /M "Generate JWT_SECRET?"
    if errorlevel 2 goto skip_jwt
    if errorlevel 1 (
        echo.
        echo Your JWT_SECRET:
        openssl rand -base64 32
        echo.
        echo [ACTION] Copy this to .env.local as JWT_SECRET
        pause
    )
    :skip_jwt
    
    echo.
    choice /M "Generate ADMIN_SECRET?"
    if errorlevel 2 goto skip_admin
    if errorlevel 1 (
        echo.
        echo Your ADMIN_SECRET:
        openssl rand -base64 32
        echo.
        echo [ACTION] Copy this to .env.local as ADMIN_SECRET
        pause
    )
    :skip_admin
) else (
    echo [WARNING] OpenSSL not found - cannot generate secrets automatically
    echo [ACTION] Visit https://generate-secret.vercel.app to generate secrets
    echo.
)

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Edit .env.local and add all required secrets
echo 2. Rotate your GEMINI_API_KEY at https://aistudio.google.com/app/apikey
echo 3. Review IMPLEMENTATION_GUIDE.md for remaining manual steps
echo 4. Test with: npm run dev
echo.
echo For detailed instructions, see:
echo   - SUMMARY.md (overview)
echo   - IMPLEMENTATION_GUIDE.md (step-by-step)
echo   - SECURITY_IMPROVEMENTS.md (technical details)
echo.
pause
