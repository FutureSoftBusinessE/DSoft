# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("PlanesServicios", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.PlanesServicios.rutas import crearPlanesServicios
from app.PlanesServicios.rutas import editarPlanesServicios
from app.PlanesServicios.rutas import eliminarPlanesServicios
from app.PlanesServicios.rutas import getAllPlanesServicios
from app.PlanesServicios.rutas import validarPlanesServiciosIMP
from app.PlanesServicios.rutas import insertarPlanesServiciosIMP
from app.PlanesServicios.rutas import getInventariosSelect
