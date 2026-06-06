# flake8: noqa
from flask import Blueprint


bp = Blueprint("CreacionClienteDF", __name__)

# APIS PARA EL CRUD
from app.CreacionClienteDF.rutas import createCreacionClienteDF
from app.CreacionClienteDF.rutas import eliminarCreacionClienteDF
from app.CreacionClienteDF.rutas import getAllCreacionClienteDF
from app.CreacionClienteDF.rutas import updateCreacionClienteDF
from app.CreacionClienteDF.rutas import validarCreacionClienteDFIMP
from app.CreacionClienteDF.rutas import insertarCreacionClienteDFIMP
