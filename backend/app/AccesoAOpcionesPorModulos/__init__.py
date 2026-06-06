from flask import Blueprint


bp = Blueprint("AccesoAOpcionesPorModulos", __name__)


from app.AccesoAOpcionesPorModulos.rutas import getAllUsersModulos
from app.AccesoAOpcionesPorModulos.rutas import getAllOpcionesModulo
from app.AccesoAOpcionesPorModulos.rutas import save_permisos_completos
from app.AccesoAOpcionesPorModulos.rutas import get_acciones_opcion
from app.AccesoAOpcionesPorModulos.rutas import get_acciones_usuario_modulo
