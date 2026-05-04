# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("linea", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

from app.linea.rutas import get_linea_by_parent
from app.linea.rutas import get_lineas
from app.linea.rutas import get_lineas_roots
from app.linea.rutas import get_lineas_tree_by_root
