from flask import Blueprint


bp = Blueprint("EjecucionTareas", __name__)


from app.EjecucionTareas.rutas import getAllEventsCalendar
from app.EjecucionTareas.rutas import getAllUsuariosAsignados
from app.EjecucionTareas.rutas import getSpecificEvent
from app.EjecucionTareas.rutas import saveEjecucionEvento
