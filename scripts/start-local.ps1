# PeopleFlow Local Environment Launcher
# Starts Dev (5173/3000) and QA (5174/3001) as background processes
#
# Usage:
#   .\scripts\start-local.ps1           # start both
#   .\scripts\start-local.ps1 -Env dev  # start dev only
#   .\scripts\start-local.ps1 -Env qa   # start qa only
#   .\scripts\start-local.ps1 -Stop     # stop all

param(
    [ValidateSet("both", "dev", "qa")]
    [string]$Env = "both",
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
$repoRoot  = Split-Path -Parent $PSScriptRoot
$apiDir    = Join-Path $repoRoot "apps\api"
$webDir    = Join-Path $repoRoot "apps\web"
$viteBin   = Join-Path $repoRoot "node_modules\.bin\vite.cmd"
$logsDir   = Join-Path $repoRoot "logs"
$pidFile   = Join-Path $logsDir "pids.json"

function Ensure-Dirs {
    if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }
}

function Stop-All {
    if (Test-Path $pidFile) {
        $pids = Get-Content $pidFile | ConvertFrom-Json
        foreach ($p in $pids.PSObject.Properties) {
            try {
                Stop-Process -Id $p.Value -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped $($p.Name) (PID $($p.Value))"
            } catch { Write-Host "Could not stop $($p.Name)" }
        }
        Remove-Item $pidFile -Force
        Write-Host "All PeopleFlow processes stopped."
    } else {
        Write-Host "No running PeopleFlow processes found."
    }
}

function Start-Api {
    param([string]$EnvName, [int]$Port, [string]$DbFile, [string]$WebOrigin, [string]$JwtSecret)

    Write-Host "Starting $EnvName API on port $Port..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "node.exe"
    $psi.WorkingDirectory = $apiDir
    $psi.Arguments = "dist/src/main.js"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.EnvironmentVariables["PORT"] = "$Port"
    $psi.EnvironmentVariables["DATABASE_URL"] = "file:./prisma/$DbFile"
    $psi.EnvironmentVariables["JWT_SECRET"] = $JwtSecret
    $psi.EnvironmentVariables["WEB_ORIGIN"] = $WebOrigin
    $psi.EnvironmentVariables["NODE_ENV"] = "development"
    $proc = [System.Diagnostics.Process]::Start($psi)
    Write-Host "  $EnvName API PID: $($proc.Id)"
    return $proc.Id
}

function Start-Web {
    param([string]$EnvName, [string]$ConfigFile)

    Write-Host "Starting $EnvName Web..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.WorkingDirectory = $webDir
    $psi.Arguments = "/c `"$viteBin`" --config $ConfigFile"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $proc = [System.Diagnostics.Process]::Start($psi)
    Write-Host "  $EnvName Web PID: $($proc.Id)"
    return $proc.Id
}

function Wait-Healthy {
    param([string]$Url, [string]$Label, [int]$Retries = 10)
    for ($i = 0; $i -lt $Retries; $i++) {
        Start-Sleep -Seconds 3
        try {
            $r = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3 -ErrorAction Stop
            Write-Host "  ✓ $Label is healthy"
            return
        } catch { }
    }
    Write-Host "  ✗ $Label did not respond in time"
}

# ── Main ─────────────────────────────────────────────────────────────────────

if ($Stop) {
    Stop-All
    exit 0
}

Ensure-Dirs

# Build API if dist is missing
if (-not (Test-Path "$apiDir\dist\src\main.js")) {
    Write-Host "==> Building API (first time)..."
    Push-Location $repoRoot
    npm run build --workspace api
    Pop-Location
}

$pids = @{}

if ($Env -eq "dev" -or $Env -eq "both") {
    $pids["dev-api"] = Start-Api -EnvName "Dev" -Port 3000 -DbFile "dev.db" `
        -WebOrigin "http://localhost:5173" `
        -JwtSecret "local-dev-secret-min-32-chars-ok!!"
    $pids["dev-web"] = Start-Web -EnvName "Dev" -ConfigFile "vite.config.ts"
}

if ($Env -eq "qa" -or $Env -eq "both") {
    $pids["qa-api"] = Start-Api -EnvName "QA" -Port 3001 -DbFile "qa.db" `
        -WebOrigin "http://localhost:5174" `
        -JwtSecret "local-qa-secret-min-32-chars-ok!!!"
    $pids["qa-web"] = Start-Web -EnvName "QA" -ConfigFile "vite.config.qa.ts"
}

# Save PIDs for stop
$pids | ConvertTo-Json | Set-Content $pidFile

Write-Host ""
Write-Host "Waiting for services to become healthy..."
if ($Env -eq "dev" -or $Env -eq "both") {
    Wait-Healthy "http://localhost:3000/api/health" "Dev API"
    Wait-Healthy "http://localhost:5173"            "Dev Web"
}
if ($Env -eq "qa" -or $Env -eq "both") {
    Wait-Healthy "http://localhost:3001/api/health" "QA API"
    Wait-Healthy "http://localhost:5174"            "QA Web"
}

Write-Host ""
Write-Host "=============================="
Write-Host "  PeopleFlow Environments"
Write-Host "=============================="
if ($Env -eq "dev" -or $Env -eq "both") {
    Write-Host "  DEV  -> http://localhost:5173"
    Write-Host "         Login: Admin / admin123"
}
if ($Env -eq "qa" -or $Env -eq "both") {
    Write-Host "  QA   -> http://localhost:5174"
    Write-Host "         Login: Admin / admin123"
}
Write-Host ""
Write-Host "  Stop all: .\scripts\start-local.ps1 -Stop"
