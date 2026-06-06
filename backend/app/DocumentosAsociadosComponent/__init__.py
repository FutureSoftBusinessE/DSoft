# flake8: noqa
from flask import Blueprint


bp = Blueprint("DocumentosAsociadosComponent", __name__)


# APIS PARA EL CRUD

from app.DocumentosAsociadosComponent.rutas import routes
