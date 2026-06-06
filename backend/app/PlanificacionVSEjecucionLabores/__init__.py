# flake8: noqa
from flask import Blueprint


bp = Blueprint("PlanificacionVSEjecucionLabores", __name__)


from app.PlanificacionVSEjecucionLabores.rutas import getInfoTable
from app.PlanificacionVSEjecucionLabores.rutas import getAllEmpleados
from app.PlanificacionVSEjecucionLabores.rutas import getAllLocalidades
