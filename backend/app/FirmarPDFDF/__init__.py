# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("FirmarPDFDF", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD
from app.FirmarPDFDF.rutas import firmarDocumentoVisualDF
from app.FirmarPDFDF.rutas import procesarFirmaDF
from app.FirmarPDFDF.rutas import verificarFirmaPDF
