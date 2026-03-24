@echo off
echo ========================================
echo Tyme Global Password Manager - Startup Script
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker is not installed or not running!
    echo.
    echo Please ensure PostgreSQL is running manually or:
    echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
    echo 2. Or install PostgreSQL manually
    echo.
    echo Press any key to continue anyway...
    pause >nul
) else (
    echo Starting PostgreSQL database...
    docker compose up -d
    echo Waiting for database to be ready...
    timeout /t 5 /nobreak >nul
    echo.
)

REM Check if migrations have been run
echo Checking database setup...
call npm run migrate --workspace=backend
if %errorlevel% equ 0 (
    echo Database migrations completed successfully!
    echo.

    echo Creating initial admin user...
    call npm run seed --workspace=backend
    echo.
)

echo ========================================
echo Starting development servers...
echo ========================================
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:3001
echo.
echo Default admin credentials:
echo   Username: admin
echo   Password: Admin123!
echo.
echo Press Ctrl+C to stop the servers
echo ========================================
echo.

call npm run dev
