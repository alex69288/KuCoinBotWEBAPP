@echo off
echo Starting KuCoin Trading Bot in Production Mode...

REM Prefer per-service env files: backend/.env then root .env
IF EXIST "%CD%\backend\.env" (
    echo Loading backend\.env
    FOR /F "tokens=*" %%I IN ("backend\.env") DO SET %%I
) ELSE IF EXIST "%CD%\.env" (
    echo Loading root .env (deprecated)
    FOR /F "tokens=*" %%I IN (".env") DO SET %%I
) ELSE (
    echo Error: No env file found. Create backend\.env with required environment variables.
    EXIT /B 1
)

REM Optionally load frontend env for build
IF EXIST "%CD%\frontend\.env" (
    echo Loading frontend\.env
    FOR /F "tokens=*" %%I IN ("frontend\.env") DO SET %%I
)

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