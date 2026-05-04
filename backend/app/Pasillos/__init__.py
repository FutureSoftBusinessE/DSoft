from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Pasillos", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

from app.Pasillos.rutas import getPasillos
from app.Pasillos.rutas import deletePasillo
from app.Pasillos.rutas import updatePasillo
from app.Pasillos.rutas import createPasillo
