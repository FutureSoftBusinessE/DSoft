# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("VendedoresDF", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.VendedoresDF.rutas import createVendedoresDF
from app.VendedoresDF.rutas import eliminarVendedoresDF
from app.VendedoresDF.rutas import getAllVendedoresDF
from app.VendedoresDF.rutas import updateVendedoresDF
from app.VendedoresDF.rutas import validarVendedoresDFIMP
from app.VendedoresDF.rutas import insertarVendedoresDFIMP