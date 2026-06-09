# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("RetencionDF", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})


# from app.filter import get_filter
from app.RetencionDF.rutas import autorizarSRI
from app.RetencionDF.rutas import getCajas
from app.RetencionDF.rutas import guardarRetencion
from app.RetencionDF.rutas import consultarFacturaSRI
from app.RetencionDF.rutas import getImpuestosRetencion
from app.RetencionDF.rutas import generarCodigoTemporal
from app.RetencionDF.rutas import listar
from app.RetencionDF.rutas import descargarRIDE
from app.RetencionDF.rutas import getRetencionBuscar
