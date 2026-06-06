# flake8: noqa
from flask import Blueprint


bp = Blueprint("PerfilUsuarioDF", __name__)

# APIS PARA EL CRUD
from app.PerfilUsuarioDF.rutas import getAllPerfilUsuarioDF
from app.PerfilUsuarioDF.rutas import updatePerfilUsuarioDF
