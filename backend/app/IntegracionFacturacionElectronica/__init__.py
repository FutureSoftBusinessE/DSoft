# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("IntegracionFacturacionElectronica", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD
from app.IntegracionFacturacionElectronica.rutas import getSample
