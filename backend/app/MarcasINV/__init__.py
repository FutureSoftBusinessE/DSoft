# flake8: noqa
from flask import Blueprint


bp = Blueprint("MarcasINV", __name__)

# APIS PARA EL CRUD
from app.MarcasINV.rutas import getAllMarcasINV
from app.MarcasINV.rutas import createMarcasINV
from app.MarcasINV.rutas import eliminarMarcasINV
from app.MarcasINV.rutas import updateMarcasINV
from app.MarcasINV.rutas import validarMarcasINVIMP
from app.MarcasINV.rutas import insertarMarcasINVIMP
