from flask import Blueprint


bp = Blueprint("AccesoALocalidades", __name__)


from app.AccesoALocalidades.rutas import getAllUsuarios
from app.AccesoALocalidades.rutas import getLocalidadesByCompania
from app.AccesoALocalidades.rutas import getPermisosByUsuarioCompania
from app.AccesoALocalidades.rutas import guardarPermisosLocalidades
