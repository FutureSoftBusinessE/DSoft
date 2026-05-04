# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("CustomModalCreateCliente", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD

from app.CustomModalCreateCliente.rutas import createNewCliente
