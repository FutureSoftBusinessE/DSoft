# flake8: noqa
from flask import Blueprint


bp = Blueprint("Home", __name__)


# APIS PARA EL CRUD
from app.Home.rutas import getInfoHome
