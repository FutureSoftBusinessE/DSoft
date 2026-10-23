# Configuración
$ScriptDir = $PSScriptRoot                  # Directorio donde está este script
$ProjectRoot = Join-Path $ScriptDir "..\"   # Ruta raíz del proyecto
$SourceDir = Join-Path $ProjectRoot "backend" # Directorio fuente a comprimir
$OutputDir = Join-Path $ProjectRoot "build" # Carpeta de salida para el ZIP
$ZipPrefix = "backend"                      # Prefijo del nombre del ZIP
$AppName = "DSOFT"

# -----------------------------------------------------------------------------
# NO EDITAR A PARTIR DE AQUÍ
# -----------------------------------------------------------------------------

# Función para mostrar errores y salir
function Handle-Error {
    param($message)
    Write-Host $message -ForegroundColor Red
    exit 1
}

Write-Host "`n****BACKEND BUILD ZIP****" -ForegroundColor Yellow
# Solicitar ambiente al usuario
do {
    $Environment = Read-Host "Selecciona el ambiente (staging/production)"
} while ($Environment -notin @("staging", "production"))

# Definir archivo de entorno según el ambiente seleccionado
$EnvFile = Join-Path $SourceDir ".env.$Environment"
Write-Host "Usando archivo de entorno: $EnvFile" -ForegroundColor Cyan

# Resolver rutas absolutas
$SourcePath = Resolve-Path $SourceDir -ErrorAction SilentlyContinue
if (-not $SourcePath) {
    Handle-Error "Error: Directorio fuente no encontrado: $SourceDir"
}

$OutputPath = Resolve-Path $OutputDir -ErrorAction SilentlyContinue
if (-not $OutputPath) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    $OutputPath = Resolve-Path $OutputDir
}

# Verificar directorio fuente
if (-not (Test-Path "$SourcePath")) {
    Handle-Error "Error: Directorio fuente no encontrado en $SourcePath"
}

# Verificar que existe el archivo de entorno específico
if (-not (Test-Path $EnvFile)) {
    Handle-Error "Error: No se encontró el archivo de entorno para $Environment : $EnvFile"
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

# -----------------------------------------------------------------------------
# Crear directorio temporal para la compresión
# -----------------------------------------------------------------------------
$TempDir = Join-Path $env:TEMP "temp_build_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    # Copiar todos los archivos excluyendo los no deseados
    $ExcludeItems = @('__pycache__', '.env', '.env.*','.git', '.vscode', '*.log', 'tmp', 'temp', '.venv')
    Get-ChildItem -Path $SourcePath -Exclude $ExcludeItems |
        Copy-Item -Destination $TempDir -Recurse -Force

    # Copiar el archivo de entorno específico como .env
    Copy-Item -Path $EnvFile -Destination (Join-Path $TempDir ".env") -Force
    Write-Host "Archivo .env configurado para el ambiente: $Environment." -ForegroundColor Green

    # Contenido del version.txt
    $VersionInfo = @(
        "commit=$CommitHash"
        "branch=$Branch"
        "build=$BuildDate"
        "environment=$Environment"
    ) -join "`n"

    # version.txt dentro del paquete (el que lee Flask en el servidor)
    $VersionInfo | Set-Content -Path (Join-Path $TempDir "version.txt") -Encoding UTF8
    Write-Host "Version.txt generado en el paquete" -ForegroundColor Green

    # Copia en la raíz del proyecto con nombre propio del backend
    $BackendVersionFile = Join-Path $ProjectRoot "backend.${Environment}.version.txt"
    $VersionInfo | Set-Content -Path $BackendVersionFile -Encoding UTF8
    Write-Host "backend.${Environment}.version.txt generado en $ProjectRoot" -ForegroundColor Green

    # Nombre del ZIP (incluye commit)
    $ZipName = "${AppName}_${ZipPrefix}_${Environment}_${CurrentDate}_${CommitHash}.zip"
    $ZipPath = Join-Path $OutputPath $ZipName

    # Crear el ZIP
    Write-Host "Comprimiendo proyecto para el ambiente $Environment..." -ForegroundColor Cyan
    Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath -Force

    # Verificar éxito
    if (Test-Path $ZipPath) {
        Write-Host "¡Éxito! ZIP generado en:`n$ZipPath" -ForegroundColor Green
        Write-Host "Tamaño del archivo: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 2)) MB" -ForegroundColor Green
        Write-Host "Commit empaquetado: $CommitHash" -ForegroundColor Green
    }
    else {
        Handle-Error "Error: Fallo al generar el archivo ZIP"
    }
}
finally {
    # Limpiar directorio temporal
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}