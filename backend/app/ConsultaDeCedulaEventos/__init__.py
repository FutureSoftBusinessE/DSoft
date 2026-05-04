# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("ConsultaDeCedulaEventos", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD

from app.ConsultaDeCedulaEventos.rutas import getEventos
from app.ConsultaDeCedulaEventos.rutas import getLocalidades
from app.ConsultaDeCedulaEventos.rutas import getUsuarios
