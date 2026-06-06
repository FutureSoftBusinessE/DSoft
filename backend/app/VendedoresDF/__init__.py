# flake8: noqa
from flask import Blueprint


bp = Blueprint("VendedoresDF", __name__)

# APIS PARA EL CRUD
from app.VendedoresDF.rutas import createVendedoresDF
from app.VendedoresDF.rutas import eliminarVendedoresDF
from app.VendedoresDF.rutas import getAllVendedoresDF
from app.VendedoresDF.rutas import updateVendedoresDF
from app.VendedoresDF.rutas import validarVendedoresDFIMP
from app.VendedoresDF.rutas import insertarVendedoresDFIMP
