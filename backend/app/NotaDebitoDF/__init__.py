# flake8: noqa
from flask import Blueprint


bp = Blueprint("NotaDebitoDF", __name__)


# from app.filter import get_filter
from app.NotaDebitoDF.rutas import buscarFacturaND
from app.NotaDebitoDF.rutas import getServicios
from app.NotaDebitoDF.rutas import listar
from app.NotaDebitoDF.rutas import getCajas
from app.NotaDebitoDF.rutas import generarCodigoTemporal
from app.NotaDebitoDF.rutas import guardarNotaDebito
from app.NotaDebitoDF.rutas import autorizarSRI
from app.NotaDebitoDF.rutas import descargarRIDE
from app.NotaDebitoDF.rutas import getNotaDebitoBuscar
