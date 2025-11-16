@echo off
SETLOCAL ENABLEEXTENSIONS
SETLOCAL ENABLEDELAYEDEXPANSION

REM Отключение обработки Ctrl+C
cmd /c exit

REM Запуск PowerShell-скрипта
SET PS_SCRIPT=%~dp0start-dev.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

ENDLOCAL
exit /b 0