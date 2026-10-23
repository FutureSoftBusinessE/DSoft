# Configuración
$ScriptDir = $PSScriptRoot                        # Directorio donde está este script
$ProjectRoot = Join-Path $ScriptDir "..\"         # Ruta raíz del proyecto
$FrontendDir = Join-Path $ProjectRoot "frontend"  # Ruta al frontend
$OutputDir = Join-Path $ProjectRoot "build"       # Carpeta para los ZIPs

$BuildDir = Join-Path $FrontendDir "build"        # Ruta donde react genera el directorio build
$ZipPrefix = "frontend"                           # Prefijo del nombre del ZIP
$AppName = "DSOFT"

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

# -----------------------------------------------------------------------------
# INFO DE BUILD (idéntico en frontend y backend)
# -----------------------------------------------------------------------------
if (-not (Test-Path (Join-Path $ProjectRoot ".git"))) {
    Handle-Error "No se encontró .git en $ProjectRoot. Ejecuta el script dentro del repositorio."
}

$CommitHash = (git -C $ProjectRoot rev-parse --short HEAD 2>$null).Trim()
if (-not $CommitHash) {
    Handle-Error "No se pudo obtener el commit de git (git rev-parse --short HEAD)."
}

$Branch = (git -C $ProjectRoot rev-parse --abbrev-ref HEAD 2>$null).Trim()
if (-not $Branch -or $Branch -eq "HEAD") {
    Handle-Error "No se pudo obtener la rama actual (detached HEAD o sin repo). Abortando build."
}

# Una sola lectura de fecha para que build y nombre del zip sean coherentes
$Now = Get-Date
$BuildDate   = $Now.ToString("yyyy-MM-ddTHH:mm:ssK")   # para version.txt (con hora y offset)
$CurrentDate = $Now.ToString("yyyyMMdd")               # para el nombre del zip (solo fecha)

Write-Host "Commit: $CommitHash | Rama: $Branch | Build: $BuildDate" -ForegroundColor Cyan

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

# Contenido del version.txt
$VersionInfo = @(
    "commit=$CommitHash"
    "branch=$Branch"
    "build=$BuildDate"
    "environment=$Environment"
) -join "`n"

# version.txt dentro del build (viaja en el zip y se sirve como /version.txt)
$VersionInfo | Set-Content -Path (Join-Path $BuildDir "version.txt") -Encoding UTF8
Write-Host "Version.txt generado en build/" -ForegroundColor Green

# Copia en la raíz del proyecto con nombre propio del frontend
$FrontendVersionFile = Join-Path $ProjectRoot "frontend.${Environment}.version.txt"
$VersionInfo | Set-Content -Path $FrontendVersionFile -Encoding UTF8
Write-Host "frontend.${Environment}.version.txt generado en $ProjectRoot" -ForegroundColor Green

# Crear ZIP versionado
$ZipName = "${AppName}_${ZipPrefix}_${Environment}_${CurrentDate}_${CommitHash}.zip"
$ZipPath = Join-Path $OutputDir $ZipName

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "`n=== Creando paquete de despliegue ===" -ForegroundColor Cyan
Compress-Archive -Path "$BuildDir\*" -DestinationPath $ZipPath -Force

if (Test-Path $ZipPath) {
    Write-Host "✅ ¡Éxito! Paquete generado:`n$ZipPath" -ForegroundColor Green
    Write-Host "Tamaño: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 2)) MB" -ForegroundColor DarkGray
    Write-Host "Commit empaquetado: $CommitHash" -ForegroundColor Green
}
else {
    Handle-Error "Fallo al crear el ZIP"
}