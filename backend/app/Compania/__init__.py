# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Compania", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Compania.rutas import getAllCompania
from app.Compania.rutas import crearCompania
from app.Compania.rutas import eliminarCompania
from app.Compania.rutas import editarCompania
from app.Compania.rutas import getCompaniaByCodigo
from app.Compania.rutas import validarCompaniaIMP
from app.Compania.rutas import insertarCompaniaIMP
from app.Compania.rutas import getSiguienteCodigoCompania
from app.Compania.rutas import getCompaniaByCodigo
