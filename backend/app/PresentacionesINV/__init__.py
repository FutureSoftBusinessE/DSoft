# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("PresentacionesINV", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.PresentacionesINV.rutas import getAllPresentacionesINV
from app.PresentacionesINV.rutas import createPresentacionesINV
from app.PresentacionesINV.rutas import eliminarPresentacionesINV
from app.PresentacionesINV.rutas import updatePresentacionesINV
from app.PresentacionesINV.rutas import validarPresentacionesINVIMP
from app.PresentacionesINV.rutas import insertarPresentacionesINVIMP