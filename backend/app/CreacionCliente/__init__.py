from flask import Blueprint


bp = Blueprint("CreacionCliente", __name__)

from app.CreacionCliente.rutas import rutas_clientes
