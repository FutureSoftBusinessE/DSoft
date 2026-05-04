from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Cargos", __name__)

# Configuración estricta de CORS según tu estándar
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# IMPORTANTE: Las rutas siempre deben importarse DESPUÉS de declarar 'bp' y 'cors'
# para evitar el temido error de "importación circular" en Python.
from app.Cargos.rutas import getAllCargos
from app.Cargos.rutas import createCargo
from app.Cargos.rutas import eliminarCargo
from app.Cargos.rutas import updateCargo
from app.Cargos.rutas import validarCargosIMP
from app.Cargos.rutas import insertarCargosIMP
