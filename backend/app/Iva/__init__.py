# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Iva", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Iva.rutas import getAllIva
from app.Iva.rutas import crearIva
from app.Iva.rutas import editarIva
from app.Iva.rutas import validarIvaIMP
from app.Iva.rutas import insertarIvaIMP
