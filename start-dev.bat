@echo off
echo Starting KuCoin Trading Bot...

REM Start backend in a new cmd window
start "Backend" cmd /k "cd /d %~dp0backend && pwsh -NoProfile -ExecutionPolicy Bypass -File watch-backend.ps1"

REM Start frontend in a new cmd window
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend and Frontend started in separate windows.
exit /b 0