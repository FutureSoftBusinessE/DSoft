from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("EjecucionTareas", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

from app.EjecucionTareas.rutas import getAllEventsCalendar
from app.EjecucionTareas.rutas import getAllUsuariosAsignados
from app.EjecucionTareas.rutas import getSpecificEvent
from app.EjecucionTareas.rutas import saveEjecucionEvento
