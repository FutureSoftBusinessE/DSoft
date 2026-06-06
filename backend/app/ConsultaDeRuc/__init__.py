from flask import Blueprint


bp = Blueprint("ConsultaDeRuc", __name__)


from app.ConsultaDeRuc.rutas import routes
