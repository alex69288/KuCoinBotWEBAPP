@echo off
echo Starting KuCoin Trading Bot...

REM Start backend
start cmd /k "cd backend && npm run dev"

REM Start frontend
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000