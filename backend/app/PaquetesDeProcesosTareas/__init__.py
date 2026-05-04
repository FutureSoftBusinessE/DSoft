# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("PaquetesDeProcesosTareas", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD

# from app.FormularioProcesos.rutas import getAllFormularios
# from app.FormularioProcesos.rutas import deleteFormulario
# from app.FormularioProcesos.rutas import createFormulario
# from app.FormularioProcesos.rutas import getProcesos
# from app.FormularioProcesos.rutas import getFormulario
# from app.FormularioProcesos.rutas import editFormulario

from app.PaquetesDeProcesosTareas.rutas import getAllPaquetes
from app.PaquetesDeProcesosTareas.rutas import deletePaquete
from app.PaquetesDeProcesosTareas.rutas import createPaquete
from app.PaquetesDeProcesosTareas.rutas import getProcesos
from app.PaquetesDeProcesosTareas.rutas import getPaquete
from app.PaquetesDeProcesosTareas.rutas import editPaquete
from app.PaquetesDeProcesosTareas.rutas import getAllPaquetesConDetalle
