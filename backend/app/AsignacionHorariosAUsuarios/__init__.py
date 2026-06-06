from flask import Blueprint


bp = Blueprint("AsignacionHorariosAUsuarios", __name__)


from app.AsignacionHorariosAUsuarios.rutas import getAllUsuarios
from app.AsignacionHorariosAUsuarios.rutas import getAllLocalidades
from app.AsignacionHorariosAUsuarios.rutas import saveHorariosUsuario
from app.AsignacionHorariosAUsuarios.rutas import getAllHorarios
from app.AsignacionHorariosAUsuarios.rutas import getHorariosUsuario
from app.AsignacionHorariosAUsuarios.rutas import deleteHorario
