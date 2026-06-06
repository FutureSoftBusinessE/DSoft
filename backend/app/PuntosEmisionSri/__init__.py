# flake8: noqa
from flask import Blueprint


# 1. Declaración del Blueprint
bp = Blueprint("PuntosEmisionSri", __name__)

# 2. Configuración de CORS para permitir comunicación con el Frontend

# 3. APIS PARA EL CRUD (Importación de todas las rutas)
from app.PuntosEmisionSri.rutas import createPuntosEmisionSri
from app.PuntosEmisionSri.rutas import updatePuntosEmisionSri
from app.PuntosEmisionSri.rutas import eliminarPuntosEmisionSri
from app.PuntosEmisionSri.rutas import getAllPuntosEmisionSri
from app.PuntosEmisionSri.rutas import getInitialDataPuntosEmision
from app.PuntosEmisionSri.rutas import getSeriesSriByCaja
