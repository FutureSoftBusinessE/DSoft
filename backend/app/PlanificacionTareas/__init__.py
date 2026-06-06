# flake8: noqa
from flask import Blueprint


bp = Blueprint("PlanificacionTareas", __name__)


from app.PlanificacionTareas.rutas import getAllEventsCalendar
from app.PlanificacionTareas.rutas import getAllLocalidades
from app.PlanificacionTareas.rutas import getAllUsuarios
from app.PlanificacionTareas.rutas import getAllUsuariosCB
from app.PlanificacionTareas.rutas import getAllPaquetesYTareas
from app.PlanificacionTareas.rutas import getAllClientes
from app.PlanificacionTareas.rutas import getAllHorariosUsuarios
from app.PlanificacionTareas.rutas import savePlanificacion
from app.PlanificacionTareas.rutas import deleteEventosPlanificados
from app.PlanificacionTareas.rutas import getTareasAReprogramar


# Apis para Crear placas
from app.PlanificacionTareas.rutas.modalCreatePlacas import getInfoVehicleSRI
from app.PlanificacionTareas.rutas.modalCreatePlacas import createPlacaYVehiculo
from app.PlanificacionTareas.rutas.modalCreatePlacas import getAllCarrocerias
from app.PlanificacionTareas.rutas.modalCreatePlacas import getAllClases
from app.PlanificacionTareas.rutas.modalCreatePlacas import getAllCombustibles
from app.PlanificacionTareas.rutas.modalCreatePlacas import getAllPaises
from app.PlanificacionTareas.rutas.modalCreatePlacas import getAllTipos
from app.PlanificacionTareas.rutas.modalCreatePlacas import getAllPlacasCB
