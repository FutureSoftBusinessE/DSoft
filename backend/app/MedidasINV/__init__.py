# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("MedidasINV", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.MedidasINV.rutas import getAllMedidasINV
from app.MedidasINV.rutas import createMedidasINV
from app.MedidasINV.rutas import eliminarMedidasINV
from app.MedidasINV.rutas import updateMedidasINV
from app.MedidasINV.rutas import validarMedidasINVIMP
from app.MedidasINV.rutas import insertarMedidasINVIMP
