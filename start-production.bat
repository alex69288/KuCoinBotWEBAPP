@echo off
echo Starting KuCoin Trading Bot in Production Mode...

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found!
    echo Please create .env file with required environment variables.
    exit /b 1
)

REM Load environment variables from .env file
for /f "tokens=*" %%i in (.env) do set %%i

REM Build backend
echo Building backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error: Backend npm install failed!
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo Error: Backend build failed!
    exit /b 1
)

REM Build frontend
echo Building frontend...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo Error: Frontend npm install failed!
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed!
    exit /b 1
)

REM Start backend
echo Starting backend server...
cd ../backend
start "Backend Server" cmd /k "npm start"

REM Start frontend
echo Starting frontend server...
cd ../frontend
start "Frontend Server" cmd /k "npm run preview"

echo Production servers started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Press any key to exit...
pause >nul