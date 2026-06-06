# flake8: noqa
from flask import Blueprint


bp = Blueprint("BeneficiariosGravamen", __name__)

# APIS PARA EL CRUD

from app.BeneficiariosGravamen.rutas import crearBeneficiarioGravamen
from app.BeneficiariosGravamen.rutas import editarBeneficiarioGravamen
from app.BeneficiariosGravamen.rutas import eliminarBeneficiarioGravamen
from app.BeneficiariosGravamen.rutas import getAllBeneficiariosGravamen
from app.BeneficiariosGravamen.rutas import validarBeneficiariosGravamenIMP
from app.BeneficiariosGravamen.rutas import insertarBeneficiariosGravamenIMP
