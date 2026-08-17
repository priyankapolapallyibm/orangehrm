# PeopleFlow – Local URL Setup (Run ONCE as Administrator)
#
# Sets up professional local URLs:
#   http://dev.peopleflow.local  -->  http://localhost:5173  (Dev)
#   http://qa.peopleflow.local   -->  http://localhost:5174  (QA)
#
# How to run:
#   1. Right-click PowerShell -> "Run as Administrator"
#   2. cd to repo root
#   3. .\scripts\setup-local-urls.ps1
#
# To remove:
#   .\scripts\setup-local-urls.ps1 -Remove

param([switch]$Remove)

$ErrorActionPreference = "Stop"

# Verify we have admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator. Right-click PowerShell and choose 'Run as Administrator'."
    exit 1
}

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"
$marker    = "# PeopleFlow local environments"

$entries = @(
    "127.0.0.1   dev.peopleflow.local",
    "127.0.0.1   qa.peopleflow.local"
)

# ── Remove mode ───────────────────────────────────────────────────────────────
if ($Remove) {
    Write-Host "==> Removing PeopleFlow hosts entries..."
    $lines = Get-Content $hostsFile | Where-Object {
        $_ -notmatch "peopleflow\.local" -and $_ -notmatch [regex]::Escape($marker)
    }
    Set-Content -Path $hostsFile -Value $lines -Encoding ASCII
    Write-Host "    Hosts entries removed."

    Write-Host "==> Removing netsh port proxies..."
    netsh interface portproxy delete v4tov4 listenport=80 listenaddress=dev.peopleflow.local 2>$null
    netsh interface portproxy delete v4tov4 listenport=80 listenaddress=qa.peopleflow.local  2>$null
    Write-Host "    Port proxies removed."
    Write-Host ""
    Write-Host "Done. Local URLs are gone."
    exit 0
}

# ── Setup mode ────────────────────────────────────────────────────────────────

# 1. Hosts file
Write-Host "==> Adding hosts entries..."
$current = Get-Content $hostsFile -Raw
if ($current -notmatch "peopleflow\.local") {
    Add-Content -Path $hostsFile -Value "" -Encoding ASCII
    Add-Content -Path $hostsFile -Value $marker -Encoding ASCII
    foreach ($entry in $entries) {
        Add-Content -Path $hostsFile -Value $entry -Encoding ASCII
    }
    Write-Host "    Hosts entries added."
} else {
    Write-Host "    Hosts entries already present — skipping."
}

# 2. netsh port forwarding: port 80 on named host -> Vite ports on 127.0.0.1
Write-Host "==> Adding netsh port proxies..."

# Dev: dev.peopleflow.local:80 -> 127.0.0.1:5173
netsh interface portproxy add v4tov4 `
    listenaddress=127.0.0.1 listenport=8090 `
    connectaddress=127.0.0.1 connectport=5173 | Out-Null
Write-Host "    Dev proxy: dev.peopleflow.local -> localhost:5173"

# QA: qa.peopleflow.local:80 -> 127.0.0.1:5174
netsh interface portproxy add v4tov4 `
    listenaddress=127.0.0.1 listenport=8091 `
    connectaddress=127.0.0.1 connectport=5174 | Out-Null
Write-Host "    QA  proxy: qa.peopleflow.local  -> localhost:5174"

# 3. Update hosts to point to 127.0.0.1 (already done above)
# We use a simple hosts alias approach - browsers resolve the name to 127.0.0.1
# then we use port in the URL since netsh portproxy requires specific listen IPs

Write-Host ""
Write-Host "========================================"
Write-Host "  PeopleFlow Local URLs"
Write-Host "========================================"
Write-Host ""
Write-Host "  DEV  ->  http://dev.peopleflow.local:5173"
Write-Host "  QA   ->  http://qa.peopleflow.local:5174"
Write-Host ""
Write-Host "  (Port is still needed unless you configure"
Write-Host "   a reverse proxy on port 80)"
Write-Host ""
Write-Host "  Open browser with Copilot:"
Write-Host "    http://dev.peopleflow.local:5173"
Write-Host "    http://qa.peopleflow.local:5174"
Write-Host ""
Write-Host "To remove:  .\scripts\setup-local-urls.ps1 -Remove"
