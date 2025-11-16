#!/usr/bin/env pwsh
# Watch for changes in backend/src and restart the backend process.
# Before each restart, free port 8080 to ensure new process can bind.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

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
                    $pid = $parts[-1]
                    if ($pid -and $pid -match '^[0-9]+$') { $pids += [int]$pid }
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

# Start backend process function
function Start-Backend {
    param([ref]$ProcRef)

    Write-Host "Starting backend: npx tsx src/index.ts"
    # Start backend in the same console window (no extra child window)
    try {
        $p = Start-Process -FilePath "npx" -ArgumentList @("tsx", "src/index.ts") -WorkingDirectory $scriptDir -NoNewWindow -PassThru
        $ProcRef.Value = $p
        Write-Host "Backend started PID=$($p.Id)"
    } catch {
        Write-Warning "Start-Process with -NoNewWindow failed, falling back to Start-Process without -NoNewWindow"
        $p = Start-Process -FilePath "npx" -ArgumentList @("tsx", "src/index.ts") -WorkingDirectory $scriptDir -PassThru
        $ProcRef.Value = $p
        Write-Host "Backend started PID=$($p.Id) (new window)"
    }
}

function Stop-Backend {
    param([ref]$ProcRef)
    $p = $ProcRef.Value
    if ($p -and $p.Id) {
        Write-Host "Stopping backend PID=$($p.Id)"
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction Stop
        } catch {
            Write-Warning "Stop-Process failed, trying taskkill for $($p.Id)"
            & cmd /c ("taskkill /PID {0} /T /F" -f $p.Id) | Out-Null
        }
        # Give OS a moment to release sockets
        Start-Sleep -Milliseconds 300
    }
    $ProcRef.Value = $null
}

# Create FileSystemWatcher for src directory
$watchPath = Join-Path $scriptDir 'src'
if (-not (Test-Path $watchPath)) {
    Write-Warning "Watch path not found: $watchPath. Falling back to script directory."
    $watchPath = $scriptDir
}

$fsw = New-Object System.IO.FileSystemWatcher $watchPath -Property @{ IncludeSubdirectories = $true; EnableRaisingEvents = $true; NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, DirectoryName' }

$backendProc = $null
$procRef = [ref]$backendProc

# Start first time after ensuring port free
Free-Port 8080
Start-Backend -ProcRef $procRef

# Register events
$debounceTimer = $null
$debounceMs = 500

$onChange = {
    param($sender, $e)
    # debounce rapid file events
    if ($debounceTimer) { $debounceTimer.Stop(); $debounceTimer.Dispose(); $debounceTimer = $null }
    $timer = New-Object System.Timers.Timer($debounceMs)
    $timer.AutoReset = $false
    $timer.Elapsed.AddScript({
        Write-Host "File change detected: $($e.ChangeType) $($e.FullPath). Restarting backend..."
        try {
            # Stop backend, free port, then restart
            Stop-Backend -ProcRef $procRef
            Free-Port 8080
            Start-Backend -ProcRef $procRef
        } catch {
            Write-Warning "Error during restart: $_"
        }
    })
    $debounceTimer = $timer
    $timer.Start()
}

$created = Register-ObjectEvent $fsw Created -Action $onChange
$changed = Register-ObjectEvent $fsw Changed -Action $onChange
$deleted = Register-ObjectEvent $fsw Deleted -Action $onChange
$renamed = Register-ObjectEvent $fsw Renamed -Action $onChange

Write-Host "Watching $watchPath for changes. Press Ctrl+C to stop."

try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Write-Host "Shutting down watcher..."
    Unregister-Event -SourceIdentifier $created.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $changed.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $deleted.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $renamed.Name -ErrorAction SilentlyContinue
    Stop-Backend -ProcRef $procRef
    Free-Port 8080
}
