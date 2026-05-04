# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Provincia", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Provincia.rutas import crearProvincia
from app.Provincia.rutas import editarProvincia
from app.Provincia.rutas import eliminarProvincia
from app.Provincia.rutas import getAllProvincia
from app.Provincia.rutas import validarProvinciaIMP
from app.Provincia.rutas import insertarProvinciaIMP
from app.Provincia.rutas import getSiguienteCodigoProvincia
