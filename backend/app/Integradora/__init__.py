# flake8: noqa
from flask import Blueprint


bp = Blueprint("Integradora", __name__)

# APIS PARA EL CRUD

from app.Integradora.rutas import crearIntegradora
from app.Integradora.rutas import editarIntegradora
from app.Integradora.rutas import eliminarIntegradora
from app.Integradora.rutas import getAllIntegradora
from app.Integradora.rutas import validarIntegradoraIMP
from app.Integradora.rutas import insertarIntegradoraIMP
from app.Integradora.rutas import getTipoIdentificacion
from app.Integradora.rutas import getZonas
from app.Integradora.rutas import getSiguienteCodigoIntegradora
