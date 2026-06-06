# flake8: noqa
from flask import Blueprint


bp = Blueprint("CreacionUsuarios", __name__)


# APIS PARA EL CRUD

from app.CreacionUsuarios.rutas import getAllUsuarios
from app.CreacionUsuarios.rutas import getAllPerfiles
from app.CreacionUsuarios.rutas import eliminarUsuario
from app.CreacionUsuarios.rutas import upsertUsuario
from app.CreacionUsuarios.rutas import getAllUsuariosSinPerfiles
