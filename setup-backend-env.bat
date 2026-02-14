@echo off
REM Batch script to copy MongoDB credentials from .env.local to backend-service/.env
REM Run this script from the root directory: setup-backend-env.bat

echo Setting up backend service environment variables...

if exist ".env.local" (
    echo Reading .env.local...
    
    REM Extract MONGODB_URI and MONGODB_DB_NAME
    for /f "tokens=2 delims==" %%a in ('findstr /b "MONGODB_URI=" .env.local') do set MONGODB_URI=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /b "MONGODB_DB_NAME=" .env.local') do set MONGODB_DB_NAME=%%a
    
    if "%MONGODB_DB_NAME%"=="" set MONGODB_DB_NAME=evi-check
    
    if defined MONGODB_URI (
        REM Create backend-service/.env
        (
            echo # MongoDB Atlas Configuration
            echo # Auto-generated from .env.local
            echo MONGODB_URI=%MONGODB_URI%
            echo MONGODB_DB_NAME=%MONGODB_DB_NAME%
            echo PORT=5000
            echo BACKEND_SERVICE_URL=http://localhost:5000
        ) > "backend-service\.env"
        
        echo ✓ Created backend-service\.env
        echo Backend service is now configured to use MongoDB Atlas!
    ) else (
        echo ✗ Could not find MONGODB_URI in .env.local
        echo Please ensure .env.local contains MONGODB_URI=...
    )
) else (
    echo ✗ .env.local not found in current directory
    echo Please run this script from the project root directory
)

pause



