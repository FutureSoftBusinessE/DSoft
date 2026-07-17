# flake8: noqa
from flask import Blueprint


bp = Blueprint("TipoDeCompania", __name__)

# APIS PARA EL CRUD
from app.TipoDeCompania.rutas import createTipoDeCompania
from app.TipoDeCompania.rutas import eliminarTipoDeCompania
from app.TipoDeCompania.rutas import getAllTipoDeCompania
from app.TipoDeCompania.rutas import updateTipoDeCompania
from app.TipoDeCompania.rutas import validarTipoDeCompaniaIMP
from app.TipoDeCompania.rutas import insertarTipoDeCompaniaIMP
