# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Pais", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Pais.rutas import crearPais
from app.Pais.rutas import editarPais
from app.Pais.rutas import eliminarPais
from app.Pais.rutas import getAllPais
from app.Pais.rutas import validarPaisIMP
from app.Pais.rutas import insertarPaisIMP
