from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("AsignacionHorariosAUsuarios", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

from app.AsignacionHorariosAUsuarios.rutas import getAllUsuarios
from app.AsignacionHorariosAUsuarios.rutas import getAllLocalidades
from app.AsignacionHorariosAUsuarios.rutas import saveHorariosUsuario
from app.AsignacionHorariosAUsuarios.rutas import getAllHorarios
from app.AsignacionHorariosAUsuarios.rutas import getHorariosUsuario
from app.AsignacionHorariosAUsuarios.rutas import deleteHorario
