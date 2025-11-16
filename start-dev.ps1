#!/usr/bin/env pwsh
Write-Host "Starting KuCoin Trading Bot (PowerShell controller)..."

# cache current process id to avoid accidental overwrite of automatic $PID
$CurrentProcessId = $PID

function Free-Port {
    param([int]$Port)
    Write-Host "Checking port $Port..."
    try {
        $pids = @()
        if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
            $owners = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
            if ($owners) { $pids += $owners }
        }

        if (-not $pids) {
            $net = & netstat -ano | findstr ":$Port" 2>$null
            if ($net) {
                $lines = $net -split "\r?\n" | Where-Object { $_ -match '\S' }
                foreach ($ln in $lines) {
                    $parts = ($ln -replace ' +', ' ') -split ' '
                    $processId = $parts[-1]
                    if ($processId -and $processId -match '^[0-9]+$') { $pids += [int]$processId }
                }
            }
        }

        $pids = $pids | Sort-Object -Unique
        foreach ($procId in $pids) {
            if ($procId -and $procId -ne $CurrentProcessId) {
                Write-Host "Killing process $procId on port $Port"
                try { Stop-Process -Id $procId -Force -ErrorAction Stop } catch { & cmd /c ("taskkill /PID {0} /T /F" -f $procId) | Out-Null }
            }
        }
        if (-not $pids) { Write-Host "No process found on port $Port" }
    } catch {
        Write-Warning "Error while freeing port ${Port}: ${_}"
    }
}

# Free port 8080 before starting backend
Free-Port 8080

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Launching backend and frontend in new windows..."

$watchScript = "$scriptDir\\backend\\watch-backend.ps1"
$backendCmd = "-NoProfile -ExecutionPolicy Bypass -File `"$watchScript`""
$frontendArgs = "/k cd `"$scriptDir\frontend`" && npm run dev"

# Start backend watcher in a new PowerShell window (this will act as the backend window)
$backendProc = Start-Process -FilePath "pwsh" -ArgumentList $backendCmd -WorkingDirectory "$scriptDir\backend" -PassThru -WindowStyle Normal
Start-Sleep -Milliseconds 400
# Start frontend in a new cmd window as before
$frontendProc = Start-Process -FilePath "cmd.exe" -ArgumentList $frontendArgs -PassThru -WindowStyle Normal

Write-Host "Backend PID: $($backendProc.Id)  Frontend PID: $($frontendProc.Id)"
Write-Host "Press Ctrl+C in this terminal to stop both windows and free ports."

try {
    Wait-Process -Id $backendProc.Id, $frontendProc.Id
}
catch [System.Exception] {
    Write-Host "Interrupted — stopping child processes..."
} finally {
    foreach ($p in @($backendProc, $frontendProc)) {
        if ($p) {
            try {
                & cmd /c ("taskkill /PID {0} /T /F" -f $p.Id) | Out-Null
            } catch {
                try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch {}
            }
        }
    }
    # Also kill processes still listening on port 8080 (node may survive if cmd killed)
    try {
        if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
            $owners = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($op in $owners) {
                if ($op -and $op -ne $CurrentProcessId) { & cmd /c ("taskkill /PID {0} /T /F" -f $op) | Out-Null }
            }
        } else {
            $lines = & netstat -ano | findstr ":8080" 2>$null
            if ($lines) {
                $arr = $lines -split "\r?\n" | Where-Object { $_ -match '\S' }
                foreach ($ln in $arr) {
                    $parts = ($ln -replace ' +', ' ') -split ' '
                    $procId = $parts[-1]
                    if ($procId -and $procId -ne $CurrentProcessId) { & cmd /c ("taskkill /PID {0} /T /F" -f $procId) | Out-Null }
                }
            }
        }
    } catch {}

    # Ensure port cleaned
    Free-Port 8080
    Write-Host "All stopped."
    exit 0
} # Закрытие блока finally
