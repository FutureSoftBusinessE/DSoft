from flask import Blueprint

bp = Blueprint("SecuenciasInternas", __name__)

from app.SecuenciasInternas.rutas import getAllSecuenciasInternas, createSecuenciasInternas, updateSecuenciasInternas, eliminarSecuenciasInternas
