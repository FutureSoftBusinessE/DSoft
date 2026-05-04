# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Parroquia", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.Parroquia.rutas import crearParroquia
from app.Parroquia.rutas import editarParroquia
from app.Parroquia.rutas import eliminarParroquia
from app.Parroquia.rutas import getAllParroquia
from app.Parroquia.rutas import validarParroquiaIMP
from app.Parroquia.rutas import insertarParroquiaIMP
