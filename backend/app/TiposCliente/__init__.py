# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("TiposCliente", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.TiposCliente.rutas import getAllTiposCliente
from app.TiposCliente.rutas import crearTiposCliente
from app.TiposCliente.rutas import eliminarTiposCliente
from app.TiposCliente.rutas import editarTiposCliente
from app.TiposCliente.rutas import getTiposClienteByCodigo
from app.TiposCliente.rutas import validarTiposClienteIMP
from app.TiposCliente.rutas import insertarTiposClienteIMP
from app.TiposCliente.rutas.selections import getSelectOptions
from app.TiposCliente.rutas.selections import getBancos
from app.TiposCliente.rutas.selections import getTarjetas
from app.TiposCliente.rutas.selections import getVendedores
from app.TiposCliente.rutas.selections import getLineas
from app.TiposCliente.rutas.selections import getMarcas
from app.TiposCliente.rutas.selections import getArticulos
from app.TiposCliente.rutas.selections import getLocalidades
from app.TiposCliente.rutas import getNextCodigo
