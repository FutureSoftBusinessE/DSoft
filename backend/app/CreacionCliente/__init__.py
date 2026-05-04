from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("CreacionCliente", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

from app.CreacionCliente.rutas import getAllClientes
from app.CreacionCliente.rutas import saveCliente
from app.CreacionCliente.rutas import getSpecificCliente
from app.CreacionCliente.rutas import editSpecificCliente
from app.CreacionCliente.rutas import deleteCliente
