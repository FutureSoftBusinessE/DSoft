#!/usr/bin/env sh
# Activar el entorno virtual
. .venv/Scripts/activate

# Ejecutar black y flake8 en el directorio backend
pre-commit run
