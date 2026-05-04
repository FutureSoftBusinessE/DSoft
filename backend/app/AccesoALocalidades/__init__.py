from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("AccesoALocalidades", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})


from app.AccesoALocalidades.rutas import getAllUsuarios
from app.AccesoALocalidades.rutas import getLocalidadesByCompania
from app.AccesoALocalidades.rutas import getPermisosByUsuarioCompania
from app.AccesoALocalidades.rutas import guardarPermisosLocalidades
