@echo off
echo Starting KuCoin Trading Bot...

REM Delegate process control to PowerShell for better signal handling
SET PS_SCRIPT=%~dp0start-dev.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
goto :eof