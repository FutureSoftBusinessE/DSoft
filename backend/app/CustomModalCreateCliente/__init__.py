# flake8: noqa
from flask import Blueprint


bp = Blueprint("CustomModalCreateCliente", __name__)


# APIS PARA EL CRUD

from app.CustomModalCreateCliente.rutas import createNewCliente
