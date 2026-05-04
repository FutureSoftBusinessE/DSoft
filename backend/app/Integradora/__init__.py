# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Integradora", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Integradora.rutas import crearIntegradora
from app.Integradora.rutas import editarIntegradora
from app.Integradora.rutas import eliminarIntegradora
from app.Integradora.rutas import getAllIntegradora
from app.Integradora.rutas import validarIntegradoraIMP
from app.Integradora.rutas import insertarIntegradoraIMP
from app.Integradora.rutas import getTipoIdentificacion
from app.Integradora.rutas import getZonas
from app.Integradora.rutas import getSiguienteCodigoIntegradora
