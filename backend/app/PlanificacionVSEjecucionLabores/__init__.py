# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("PlanificacionVSEjecucionLabores", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

from app.PlanificacionVSEjecucionLabores.rutas import getInfoTable
from app.PlanificacionVSEjecucionLabores.rutas import getAllEmpleados
from app.PlanificacionVSEjecucionLabores.rutas import getAllLocalidades
