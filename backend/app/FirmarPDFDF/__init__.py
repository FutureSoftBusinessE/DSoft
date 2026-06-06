# flake8: noqa
from flask import Blueprint


bp = Blueprint("FirmarPDFDF", __name__)


# APIS PARA EL CRUD
from app.FirmarPDFDF.rutas import firmarDocumentoVisualDF
from app.FirmarPDFDF.rutas import procesarFirmaDF
from app.FirmarPDFDF.rutas import verificarFirmaPDF
