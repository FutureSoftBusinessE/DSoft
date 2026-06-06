# flake8: noqa
from flask import Blueprint


bp = Blueprint("MedidasINV", __name__)

# APIS PARA EL CRUD
from app.MedidasINV.rutas import getAllMedidasINV
from app.MedidasINV.rutas import createMedidasINV
from app.MedidasINV.rutas import eliminarMedidasINV
from app.MedidasINV.rutas import updateMedidasINV
from app.MedidasINV.rutas import validarMedidasINVIMP
from app.MedidasINV.rutas import insertarMedidasINVIMP
