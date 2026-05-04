# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Ciudad", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Ciudad.rutas import crearCiudad
from app.Ciudad.rutas import editarCiudad
from app.Ciudad.rutas import eliminarCiudad
from app.Ciudad.rutas import getAllCiudad
from app.Ciudad.rutas import validarCiudadIMP
from app.Ciudad.rutas import insertarCiudadIMP
from app.Ciudad.rutas import getSiguienteCodigoCiudad
