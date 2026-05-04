# Configuración
$ScriptDir = $PSScriptRoot                        # Directorio donde está este script
$ProjectRoot = Join-Path $ScriptDir "..\"         # Ruta raíz del proyecto
$FrontendDir = Join-Path $ProjectRoot "frontend"  # Ruta al frontend
$OutputDir = Join-Path $ProjectRoot "build"       # Carpeta para los ZIPs

$BuildDir = Join-Path $FrontendDir "build"        # Ruta donde react genera el directorio build
$ZipPrefix = "frontend"                           # Prefijo del nombre del ZIP

# -----------------------------------------------------------------------------
# NO EDITAR A PARTIR DE AQUÍ
# -----------------------------------------------------------------------------

function Handle-Error {
    param($message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
    exit 1
}

Write-Host "`n****FRONTEND BUILD ZIP****" -ForegroundColor Yellow
# Solicitar ambiente al usuario
do {
    $Environment = Read-Host "Selecciona el ambiente (staging/production)"
} while ($Environment -notin @("staging", "production"))

$BuildCommand = "build:$Environment"              # Tipo de build a ejecutar

# Verificar dependencias
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Handle-Error "Node.js/npm no está instalado"
}

# Navegar al directorio del frontend
try {
    Set-Location $FrontendDir -ErrorAction Stop
}
catch {
    Handle-Error "No se pudo acceder al directorio: $FrontendDir"
}

# Limpiar builds anteriores
if (Test-Path $BuildDir) {
    Remove-Item $BuildDir -Recurse -Force
}

# Ejecutar construcción
Write-Host "`n=== Construyendo frontend ($Environment) ===" -ForegroundColor Cyan
Write-Host "Ejecutando: npm run $BuildCommand`n" -ForegroundColor DarkGray

npm run $BuildCommand

if ($LASTEXITCODE -ne 0) {
    Handle-Error "Falló la construcción del frontend"
}

# Verificar build generado
if (-not (Test-Path $BuildDir)) {
    Handle-Error "No se generó el directorio build: $BuildDir"
}

# Crear ZIP versionado
$CommitHash = (git rev-parse --short HEAD).Trim()
$ZipName = "${ZipPrefix}_${Environment}_$(Get-Date -Format 'yyyyMMdd')_${CommitHash}.zip"
$ZipPath = Join-Path $OutputDir $ZipName

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "`n=== Creando paquete de despliegue ===" -ForegroundColor Cyan
Compress-Archive -Path "$BuildDir\*" -DestinationPath $ZipPath -Force

if (Test-Path $ZipPath) {
    Write-Host "✅ ¡Éxito! Paquete generado:`n$ZipPath" -ForegroundColor Green
    Write-Host "Tamaño: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 2)) MB" -ForegroundColor DarkGray
}
else {
    Handle-Error "Fallo al crear el ZIP"
}