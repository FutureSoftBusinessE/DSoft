# flake8: noqa
from flask import Blueprint


bp = Blueprint("ProveedoresDF", __name__)

# APIS PARA EL CRUD
from app.ProveedoresDF.rutas import createProveedoresDF
from app.ProveedoresDF.rutas import eliminarProveedoresDF
from app.ProveedoresDF.rutas import getAllProveedoresDF
from app.ProveedoresDF.rutas import updateProveedoresDF
from app.ProveedoresDF.rutas import validarProveedoresDFIMP
from app.ProveedoresDF.rutas import insertarProveedoresDFIMP
