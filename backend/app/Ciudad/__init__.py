# flake8: noqa
from flask import Blueprint


bp = Blueprint("Ciudad", __name__)

# APIS PARA EL CRUD

from app.Ciudad.rutas import crearCiudad
from app.Ciudad.rutas import editarCiudad
from app.Ciudad.rutas import eliminarCiudad
from app.Ciudad.rutas import getAllCiudad
from app.Ciudad.rutas import validarCiudadIMP
from app.Ciudad.rutas import insertarCiudadIMP
from app.Ciudad.rutas import getSiguienteCodigoCiudad
