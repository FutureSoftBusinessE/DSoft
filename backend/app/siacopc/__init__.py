# flake8: noqa
from flask import Blueprint

bp = Blueprint("siacopc", __name__)


from app.siacopc import routes
from app.siacopc.rutas import obtener_items
