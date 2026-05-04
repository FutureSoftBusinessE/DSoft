from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("AccesoACompaniasYModulos", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

from app.AccesoACompañiasYModulos.rutas import getAllAccesos
from app.AccesoACompañiasYModulos.rutas import getAllUsuarios
from app.AccesoACompañiasYModulos.rutas import getAllInfoModalAccesos
from app.AccesoACompañiasYModulos.rutas import saveAccesos
