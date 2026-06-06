# flake8: noqa
from flask import Blueprint


bp = Blueprint("LineasINV", __name__)

# APIS PARA EL CRUD
from app.LineasINV.rutas import getAllLineasINV
from app.LineasINV.rutas import createLineasINV
from app.LineasINV.rutas import eliminarLineasINV
from app.LineasINV.rutas import updateLineasINV
from app.LineasINV.rutas import validarLineasINVIMP
from app.LineasINV.rutas import insertarLineasINVIMP
from app.LineasINV.rutas import utilsLineasINV
