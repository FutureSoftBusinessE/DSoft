# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Localidad", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Localidad.rutas import getAllLocalidad
from app.Localidad.rutas import crearLocalidad
from app.Localidad.rutas import eliminarLocalidad
from app.Localidad.rutas import editarLocalidad
from app.Localidad.rutas import getLocalidadByCodigo
from app.Localidad.rutas import validarLocalidadIMP
from app.Localidad.rutas import insertarLocalidadIMP
from app.Localidad.rutas import getSiguienteCodigoLocalidad
