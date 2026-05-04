# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("TipoDocumento", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.TipoDocumento.rutas import getAllTipoDocumento
from app.TipoDocumento.rutas import crearTipoDocumento
from app.TipoDocumento.rutas import eliminarTipoDocumento
from app.TipoDocumento.rutas import editarTipoDocumento
from app.TipoDocumento.rutas import validarTipoDocumentoIMP
from app.TipoDocumento.rutas import insertarTipoDocumentoIMP
from app.TipoDocumento.rutas import getSiguienteCodigoTipoDocumento
