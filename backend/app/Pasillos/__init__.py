from flask import Blueprint


bp = Blueprint("Pasillos", __name__)


from app.Pasillos.rutas import getPasillos
from app.Pasillos.rutas import deletePasillo
from app.Pasillos.rutas import updatePasillo
from app.Pasillos.rutas import createPasillo
