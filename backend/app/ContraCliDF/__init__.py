# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("ContraCliDF", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.ContraCliDF.rutas import createContraCliDF
from app.ContraCliDF.rutas import getAllContraCliDF
from app.ContraCliDF.rutas import updateContraCliDF
from app.ContraCliDF.rutas import getByIdContraCliDF
from app.ContraCliDF.rutas import getArticuloData
from app.ContraCliDF.rutas import getInitialDataDF
