# Drivia — autodeploy (Windows)
$ErrorActionPreference = "Stop"

$LAB_CATEGORY = "AUTH"
$LAB_NAME     = "kanbia"
$LAB_PORT     = "1000"
$LAB_CREDS    = "attacker@kanbia.local / password123"
$LAB_DIFF     = "Medium"
$LAB_VULN     = "JWT secret disclosure -> privilege escalation"

function Test-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "Docker not found. Install Docker Desktop." -ForegroundColor Red; exit 1
    }
    try { docker info > $null 2>&1 } catch {
        Write-Host "Docker daemon is not running." -ForegroundColor Red; exit 1
    }
}

function Banner {
    Write-Host ""
    Write-Host "  KANBIA - tableros kanban de equipo" -ForegroundColor Blue
    Write-Host "  Bug Bounty Labs by @_.gorkaaa.b" -ForegroundColor Yellow
    Write-Host "  https://www.instagram.com/_.gorkaaa.b/"
    Write-Host ""
    Write-Host "  [$LAB_CATEGORY] $LAB_NAME" -ForegroundColor Green
    Write-Host "  $LAB_VULN"
    Write-Host "  Difficulty: $LAB_DIFF" -ForegroundColor Yellow
    Write-Host ""
}

function Deploy {
    Write-Host "  [*] Building lab image..." -ForegroundColor Cyan
    docker compose up --build -d | Out-Null
    Write-Host "  [*] Waiting for service..." -NoNewline
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri "http://localhost:$LAB_PORT/" -ErrorAction Stop
            if ($r.StatusCode -ge 200) { break }
        } catch { }
        Start-Sleep -Seconds 2; Write-Host "." -NoNewline
    }
    Write-Host " Ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Lab deployed successfully!" -ForegroundColor Green
    Write-Host "  URL:         http://localhost:$LAB_PORT"
    Write-Host "  Credentials: $LAB_CREDS"
    Write-Host "  Writeup:     http://localhost:$LAB_PORT/writeup"
    Write-Host ""
    Write-Host "  Press Ctrl+C to stop and remove the lab" -ForegroundColor Red
    Write-Host ""
}

Banner
Test-Docker
$action = if ($args.Count -gt 0) { $args[0] } else { "deploy" }
switch ($action) {
    "deploy" {
        Deploy
        try { while ($true) { Start-Sleep -Seconds 1 } }
        finally { Write-Host ""; docker compose down -v 2>$null; Write-Host "  [+] Lab removed. Goodbye!" -ForegroundColor Green }
    }
    "destroy" { docker compose down -v }
    "status"  { docker compose ps }
    default   { Write-Host "Usage: pwsh autodeploy.ps1 [deploy|destroy|status]" }
}
