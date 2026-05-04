# Configuración
$ScriptDir = $PSScriptRoot                  # Directorio donde está este script
$ProjectRoot = Join-Path $ScriptDir "..\"   # Ruta raíz del proyecto
$SourceDir = Join-Path $ProjectRoot "backend" # Directorio fuente a comprimir
$OutputDir = Join-Path $ProjectRoot "build" # Carpeta de salida para el ZIP
$ZipPrefix = "backend"                      # Prefijo del nombre del ZIP

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
    $ambiente = Read-Host "Selecciona el ambiente (staging/production)"
} while ($ambiente -notin @("staging", "production"))

# Definir archivo de entorno según el ambiente seleccionado
$EnvFile = Join-Path $SourceDir ".env.$ambiente"
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
    Handle-Error "Error: No se encontró el archivo de entorno para $ambiente : $EnvFile"
}

# Crear directorio temporal para la compresión
$TempDir = Join-Path $env:TEMP "temp_build_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    # Copiar todos los archivos excluyendo los no deseados
    $ExcludeItems = @('__pycache__', '.env', '.env.*','.git', '.vscode', '*.log', 'tmp', 'temp', '.venv')
    Get-ChildItem -Path $SourcePath -Exclude $ExcludeItems |
        Copy-Item -Destination $TempDir -Recurse -Force

    # Copiar el archivo de entorno específico como .env
    Copy-Item -Path $EnvFile -Destination (Join-Path $TempDir ".env") -Force
    Write-Host "Archivo .env configurado para el ambiente: $ambiente" -ForegroundColor Green

    # Generar nombre del ZIP
    $CurrentDate = Get-Date -Format "yyyyMMdd"
    $ZipName = "${ZipPrefix}_${ambiente}_${CurrentDate}.zip"
    $ZipPath = Join-Path $OutputPath $ZipName

    # Crear el ZIP
    Write-Host "Comprimiendo proyecto para el ambiente $ambiente..." -ForegroundColor Cyan
    Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath -Force

    # Verificar éxito
    if (Test-Path $ZipPath) {
        Write-Host "¡Éxito! ZIP generado en:`n$ZipPath" -ForegroundColor Green
        Write-Host "Tamaño del archivo: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 2)) MB" -ForegroundColor Green
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