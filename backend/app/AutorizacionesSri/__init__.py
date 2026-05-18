# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

# 1. Declaración del Blueprint
bp = Blueprint("AutorizacionesSri", __name__)

# 2. Configuración de CORS para permitir comunicación con el Frontend
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# 3. APIS PARA EL CRUD (Importación de todas las rutas)
from app.AutorizacionesSri.rutas import createAutorizacionesSri
from app.AutorizacionesSri.rutas import updateAutorizacionesSri
from app.AutorizacionesSri.rutas import eliminarAutorizacionesSri
from app.AutorizacionesSri.rutas import getAllAutorizacionesSri
