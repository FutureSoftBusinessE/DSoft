# flake8: noqa
from flask import Blueprint


bp = Blueprint("ImpuestosRetenciones", __name__)

# APIS PARA EL CRUD

from app.ImpuestosRetenciones.rutas import crearImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import editarImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import eliminarImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import getAllImpuestosRetenciones
from app.ImpuestosRetenciones.rutas import validarImpuestosRetencionesIMP
from app.ImpuestosRetenciones.rutas import insertarImpuestosRetencionesIMP
from app.ImpuestosRetenciones.rutas import getCuentasContables
from app.ImpuestosRetenciones.rutas import getCompaniasParaReplica
from app.ImpuestosRetenciones.rutas import replicarImpuesto
