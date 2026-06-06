# flake8: noqa
from flask import Blueprint


bp = Blueprint("GuiadeRemisionDF", __name__)


# from app.filter import get_filter
from app.GuiadeRemisionDF.rutas import autorizarSRI
from app.GuiadeRemisionDF.rutas import buscarFacturaGR
from app.GuiadeRemisionDF.rutas import descargarRIDE
from app.GuiadeRemisionDF.rutas import generarCodigoTemporal
from app.GuiadeRemisionDF.rutas import getArticulos
from app.GuiadeRemisionDF.rutas import getCajas
from app.GuiadeRemisionDF.rutas import getCiudades
from app.GuiadeRemisionDF.rutas import getCliente
from app.GuiadeRemisionDF.rutas import getGuiaBuscar
from app.GuiadeRemisionDF.rutas import getTransportistas
from app.GuiadeRemisionDF.rutas import guardarGuia
from app.GuiadeRemisionDF.rutas import listar
from app.GuiadeRemisionDF.rutas import getFacturaDetalleGR
