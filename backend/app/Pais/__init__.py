# flake8: noqa
from flask import Blueprint


bp = Blueprint("Pais", __name__)

# APIS PARA EL CRUD

from app.Pais.rutas import crearPais
from app.Pais.rutas import editarPais
from app.Pais.rutas import eliminarPais
from app.Pais.rutas import getAllPais
from app.Pais.rutas import validarPaisIMP
from app.Pais.rutas import insertarPaisIMP
