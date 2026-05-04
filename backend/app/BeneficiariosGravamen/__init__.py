# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("BeneficiariosGravamen", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.BeneficiariosGravamen.rutas import crearBeneficiarioGravamen
from app.BeneficiariosGravamen.rutas import editarBeneficiarioGravamen
from app.BeneficiariosGravamen.rutas import eliminarBeneficiarioGravamen
from app.BeneficiariosGravamen.rutas import getAllBeneficiariosGravamen
from app.BeneficiariosGravamen.rutas import validarBeneficiariosGravamenIMP
from app.BeneficiariosGravamen.rutas import insertarBeneficiariosGravamenIMP
