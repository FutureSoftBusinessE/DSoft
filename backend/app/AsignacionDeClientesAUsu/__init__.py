from flask import Blueprint


bp = Blueprint("AsignacionDeClientesAUsu", __name__)


from app.AsignacionDeClientesAUsu.rutas import getUsuariosActivos
from app.AsignacionDeClientesAUsu.rutas import getClientesDisponibles
from app.AsignacionDeClientesAUsu.rutas import getClientesAsignados
from app.AsignacionDeClientesAUsu.rutas import getDocumentosCliente
from app.AsignacionDeClientesAUsu.rutas import saveAsignacionCartera
