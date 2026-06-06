# flake8: noqa
from flask import Blueprint


bp = Blueprint("Iva", __name__)

# APIS PARA EL CRUD

from app.Iva.rutas import getAllIva
from app.Iva.rutas import crearIva
from app.Iva.rutas import editarIva
from app.Iva.rutas import validarIvaIMP
from app.Iva.rutas import insertarIvaIMP
