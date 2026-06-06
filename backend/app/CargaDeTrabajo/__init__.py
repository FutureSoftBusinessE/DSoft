from flask import Blueprint


bp = Blueprint("CargaDeTrabajo", __name__)

from app.CargaDeTrabajo.rutas import getAllInfo
