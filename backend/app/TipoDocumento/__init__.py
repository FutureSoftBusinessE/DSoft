# flake8: noqa
from flask import Blueprint


bp = Blueprint("TipoDocumento", __name__)

# APIS PARA EL CRUD

from app.TipoDocumento.rutas import getAllTipoDocumento
from app.TipoDocumento.rutas import crearTipoDocumento
from app.TipoDocumento.rutas import eliminarTipoDocumento
from app.TipoDocumento.rutas import editarTipoDocumento
from app.TipoDocumento.rutas import validarTipoDocumentoIMP
from app.TipoDocumento.rutas import insertarTipoDocumentoIMP
from app.TipoDocumento.rutas import getSiguienteCodigoTipoDocumento
