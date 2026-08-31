from flask import Blueprint


bp = Blueprint("ResumenProductividad", __name__)

from app.ResumenProductividad.rutas import getAllInfo
