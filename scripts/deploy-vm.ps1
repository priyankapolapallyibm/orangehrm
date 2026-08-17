param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "qa")]
    [string]$EnvironmentName
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$baseCompose = Join-Path $repoRoot "compose.yaml"
$envFile = Join-Path $repoRoot ".env.$EnvironmentName"
$overlayCompose = Join-Path $repoRoot "compose.$EnvironmentName.yaml"

if (-not (Test-Path $envFile)) {
    throw "Missing environment file: $envFile"
}

if (-not (Test-Path $overlayCompose)) {
    throw "Missing compose overlay: $overlayCompose"
}

docker compose --env-file $envFile -f $baseCompose -f $overlayCompose pull
docker compose --env-file $envFile -f $baseCompose -f $overlayCompose up -d --build --remove-orphans
docker compose --env-file $envFile -f $baseCompose -f $overlayCompose ps
