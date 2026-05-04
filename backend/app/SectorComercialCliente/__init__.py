# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("SectorComercialCliente", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD

from app.SectorComercialCliente.rutas import crearSectorComercialCliente
from app.SectorComercialCliente.rutas import editarSectorComercialCliente
from app.SectorComercialCliente.rutas import eliminarSectorComercialCliente
from app.SectorComercialCliente.rutas import getAllSectorComercialCliente
from app.SectorComercialCliente.rutas import validarSectorComercialClienteIMP
from app.SectorComercialCliente.rutas import insertarSectorComercialClienteIMP
