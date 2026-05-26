from flask import Blueprint

bp = Blueprint("TipoDeCredenciales", __name__)

from app.TipoDeCredenciales.rutas import getAllTipoDeCredenciales, createTipoDeCredenciales, updateTipoDeCredenciales, eliminarTipoDeCredenciales, validarTipoDeCredencialesIMP, insertarTipoDeCredencialesIMP
