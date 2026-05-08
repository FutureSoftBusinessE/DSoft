from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("ConsultaDeRuc", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

from app.ConsultaDeRuc.rutas import routes
