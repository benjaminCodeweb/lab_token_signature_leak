param(
    [switch]$Rebuild,
    [switch]$Reinstall,
    [string]$BindAddress = '127.0.0.1'
)

# Ejecuta Kanbia SIN Docker. Un único proceso Node.js sirve API + React compilado.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$server = Join-Path $root 'server'
$client = Join-Path $root 'client'

try {
    $parsedAddress = [System.Net.IPAddress]::Parse($BindAddress)
    if ($parsedAddress.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
        throw 'Solo se admite una dirección IPv4'
    }
}
catch {
    throw "Dirección IPv4 inválida: $BindAddress"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js no está instalado. Instalá Node.js 22 LTS x64 y reintentá.'
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'No se encontró npm.cmd. Revisá la instalación de Node.js.'
}

$version = (& node --version).Trim()
if ($version -notmatch '^v([0-9]+)\.') {
    throw "No se pudo detectar la versión de Node.js: $version"
}
if ([int]$Matches[1] -lt 20) {
    throw "Kanbia necesita Node.js 20 o superior (recomendado: 22 LTS x64). Instalado: $version"
}

function Invoke-Npm {
    param([string]$Directory, [string[]]$NpmArgs)
    Push-Location $Directory
    try {
        & npm.cmd @NpmArgs
        if ($LASTEXITCODE -ne 0) {
            throw "npm $($NpmArgs -join ' ') falló en $Directory (código $LASTEXITCODE)"
        }
    }
    finally {
        Pop-Location
    }
}

$needsBuild = $Rebuild -or $Reinstall

foreach ($directory in @($server, $client)) {
    $modules = Join-Path $directory 'node_modules'
    if ($Reinstall -and (Test-Path $modules)) {
        Write-Host "[*] Borrando dependencias previas de $directory" -ForegroundColor Yellow
        Remove-Item -LiteralPath $modules -Recurse -Force
    }
    if (-not (Test-Path $modules)) {
        Write-Host "[*] Instalando dependencias: $directory" -ForegroundColor Cyan
        Invoke-Npm -Directory $directory -NpmArgs @('install', '--no-audit', '--no-fund', '--prefer-offline')
        $needsBuild = $true
    }
}

if (-not (Test-Path (Join-Path $server 'dist/index.js'))) { $needsBuild = $true }
if (-not (Test-Path (Join-Path $client 'dist/index.html'))) { $needsBuild = $true }

if ($needsBuild) {
    Write-Host '[*] Compilando frontend React (solo se repite si hace falta)...' -ForegroundColor Cyan
    Invoke-Npm -Directory $client -NpmArgs @('run', 'build')
    Write-Host '[*] Compilando backend TypeScript...' -ForegroundColor Cyan
    Invoke-Npm -Directory $server -NpmArgs @('run', 'build')
}

# La clave JWT fija es deliberada para el ejercicio. NUNCA usar en producción.
$env:NODE_ENV = 'production'
$env:HOST = $BindAddress
$env:PORT = '1000'
$env:DB_PATH = Join-Path $root 'data\kanbia.db'
if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
    $env:JWT_SECRET = 'kanbia-dev-signing-key-change-in-prod'
}
if ([string]::IsNullOrWhiteSpace($env:DEV_DEBUG_TOKEN)) {
    $env:DEV_DEBUG_TOKEN = 'kanbia-dev-1000'
}

Write-Host ''
Write-Host '  KANBIA - modo local liviano (sin Docker)' -ForegroundColor Green
if ($BindAddress -eq '0.0.0.0') {
    Write-Host '  URL:         http://<IP-DE-WINDOWS>:1000' -ForegroundColor Cyan
} else {
    Write-Host "  URL:         http://${BindAddress}:1000" -ForegroundColor Cyan
}
Write-Host '  Credenciales: attacker@kanbia.local / password123'
Write-Host '  Writeup:     http://localhost:1000/writeup'
Write-Host '  Para detener: Ctrl+C'
Write-Host ''
if ($BindAddress -eq '127.0.0.1') {
    Write-Host '  Laboratorio vulnerable disponible solo en esta PC.' -ForegroundColor Yellow
} else {
    Write-Host '  ADVERTENCIA: lab vulnerable expuesto en la interfaz indicada.' -ForegroundColor Yellow
    Write-Host '  Usar solo en una red privada de confianza; restringir firewall al equipo Burp/Kali.' -ForegroundColor Yellow
}
Write-Host ''

Push-Location $server
try {
    & node '.\dist\index.js'
    if ($LASTEXITCODE -ne 0) {
        throw "El servidor terminó con código $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}
