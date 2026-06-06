# flake8: noqa
from flask import Blueprint


bp = Blueprint("ConsultaDeCedulaEventos", __name__)


# APIS PARA EL CRUD

from app.ConsultaDeCedulaEventos.rutas import getEventos
from app.ConsultaDeCedulaEventos.rutas import getLocalidades
from app.ConsultaDeCedulaEventos.rutas import getUsuarios
