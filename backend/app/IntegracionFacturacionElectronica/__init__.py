# flake8: noqa
from flask import Blueprint


bp = Blueprint("IntegracionFacturacionElectronica", __name__)


# APIS PARA EL CRUD
from app.IntegracionFacturacionElectronica.rutas import emisionFactura
