from flask import Blueprint


bp = Blueprint("CreacionCliente", __name__)


from app.CreacionCliente.rutas import getAllClientes
from app.CreacionCliente.rutas import saveCliente
from app.CreacionCliente.rutas import getSpecificCliente
from app.CreacionCliente.rutas import editSpecificCliente
from app.CreacionCliente.rutas import deleteCliente
