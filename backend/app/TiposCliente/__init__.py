# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("TiposCliente", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.TiposCliente.rutas import createTiposCliente
from app.TiposCliente.rutas import eliminarTiposCliente
from app.TiposCliente.rutas import getAllTiposCliente
from app.TiposCliente.rutas import updateTiposCliente
from app.TiposCliente.rutas import validarTiposClienteIMP
from app.TiposCliente.rutas import insertarTiposClienteIMP
