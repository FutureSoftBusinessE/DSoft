# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("PerfilUsuarioDF", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.PerfilUsuarioDF.rutas import getAllPerfilUsuarioDF
from app.PerfilUsuarioDF.rutas import updatePerfilUsuarioDF