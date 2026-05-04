# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("CreacionUsuarios", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD

from app.CreacionUsuarios.rutas import getAllUsuarios
from app.CreacionUsuarios.rutas import getAllPerfiles
from app.CreacionUsuarios.rutas import eliminarUsuario
from app.CreacionUsuarios.rutas import upsertUsuario
from app.CreacionUsuarios.rutas import getAllUsuariosSinPerfiles
