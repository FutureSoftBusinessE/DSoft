# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("NotaCreditoDF", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})


# from app.filter import get_filter
from app.NotaCreditoDF.rutas import autorizarSRI
from app.NotaCreditoDF.rutas import getCajas
from app.NotaCreditoDF.rutas import guardarNotaCredito
from app.NotaCreditoDF.rutas import getFacturaDetalleNC
from app.NotaCreditoDF.rutas import getServicios
from app.NotaCreditoDF.rutas import generarCodigoTemporal
from app.NotaCreditoDF.rutas import listar
from app.NotaCreditoDF.rutas import descargarRIDE
from app.NotaCreditoDF.rutas import getNotaCreditoBuscar
from app.NotaCreditoDF.rutas import buscarFacturaNC
