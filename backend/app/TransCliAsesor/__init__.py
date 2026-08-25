# flake8: noqa
from flask import Blueprint


bp = Blueprint("TransCliAsesor", __name__)

# APIS PARA EL CRUD
from app.TransCliAsesor.rutas import postTransferirCartera
