# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("ProveedoresDF", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.ProveedoresDF.rutas import createProveedoresDF
from app.ProveedoresDF.rutas import eliminarProveedoresDF
from app.ProveedoresDF.rutas import getAllProveedoresDF
from app.ProveedoresDF.rutas import updateProveedoresDF
from app.ProveedoresDF.rutas import validarProveedoresDFIMP
from app.ProveedoresDF.rutas import insertarProveedoresDFIMP