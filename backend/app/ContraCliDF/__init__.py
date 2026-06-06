# flake8: noqa
from flask import Blueprint


bp = Blueprint("ContraCliDF", __name__)

# APIS PARA EL CRUD
from app.ContraCliDF.rutas import createContraCliDF
from app.ContraCliDF.rutas import getAllContraCliDF
from app.ContraCliDF.rutas import updateContraCliDF
from app.ContraCliDF.rutas import getByIdContraCliDF
from app.ContraCliDF.rutas import getArticuloData
from app.ContraCliDF.rutas import getInitialDataDF
