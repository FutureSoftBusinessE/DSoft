# flake8: noqa
from flask import Blueprint


bp = Blueprint("Parroquia", __name__)

# APIS PARA EL CRUD

from app.Parroquia.rutas import crearParroquia
from app.Parroquia.rutas import editarParroquia
from app.Parroquia.rutas import eliminarParroquia
from app.Parroquia.rutas import getAllParroquia
from app.Parroquia.rutas import validarParroquiaIMP
from app.Parroquia.rutas import insertarParroquiaIMP
