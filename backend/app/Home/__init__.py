# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("Home", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD
from app.Home.rutas import getInfoHome
