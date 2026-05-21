# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("TransportistasDF", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

# APIS PARA EL CRUD
from app.TransportistasDF.rutas import createTransportistasDF
from app.TransportistasDF.rutas import eliminarTransportistasDF
from app.TransportistasDF.rutas import getAllTransportistasDF
from app.TransportistasDF.rutas import updateTransportistasDF
from app.TransportistasDF.rutas import validarTransportistasDFIMP
from app.TransportistasDF.rutas import insertarTransportistasDFIMP
