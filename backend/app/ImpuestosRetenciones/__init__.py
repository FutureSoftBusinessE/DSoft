# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("ImpuestosRetenciones", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.ImpuestosRetenciones.rutas import crearImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import editarImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import eliminarImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import getAllImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import validarImpuestosRetencionesIMP
from app.ImpuestosRetenciones.rutas import insertarImpuestosRetencionesIMP
from app.ImpuestosRetenciones.rutas import getCuentasContables
