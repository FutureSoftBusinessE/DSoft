# flake8: noqa
from flask import Blueprint


bp = Blueprint("TransEvenAsesor", __name__)

# APIS PARA EL CRUD
from app.TransEvenAsesor.rutas import getEventosOrigen
from app.TransEvenAsesor.rutas import postTransferirEventos
