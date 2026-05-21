# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

# 1. Declaración del Blueprint
bp = Blueprint("PuntosEmisionSri", __name__)

# 2. Configuración de CORS para permitir comunicación con el Frontend
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# 3. APIS PARA EL CRUD (Importación de todas las rutas)
from app.PuntosEmisionSri.rutas import createPuntosEmisionSri
from app.PuntosEmisionSri.rutas import updatePuntosEmisionSri
from app.PuntosEmisionSri.rutas import eliminarPuntosEmisionSri
from app.PuntosEmisionSri.rutas import getAllPuntosEmisionSri
from app.PuntosEmisionSri.rutas import getInitialDataPuntosEmision
