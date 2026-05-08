# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("LineasINV", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.LineasINV.rutas import getAllLineasINV
from app.LineasINV.rutas import createLineasINV
from app.LineasINV.rutas import eliminarLineasINV
from app.LineasINV.rutas import updateLineasINV
from app.LineasINV.rutas import validarLineasINVIMP
from app.LineasINV.rutas import insertarLineasINVIMP
from app.LineasINV.rutas import utilsLineasINV