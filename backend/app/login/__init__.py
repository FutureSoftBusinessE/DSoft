# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("login", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# from app.login import routes
from app.login.rutas import buscar_cliciausu
from app.login.rutas import usuario_existe
from app.login.rutas import companias_del_usuario
from app.login.rutas import inicio_sesion
from app.login.rutas import get_localidad

# from app.login.rutas import get_menu
# from app.login.rutas import get_menu_by_parent
from app.login.rutas import generate_token
from app.login.rutas import testDynamicTables

# from app.login.rutas import obtener_usuario


# from app.login.rutas import ruta_aparte
# from app.login.rutas import *
# import app.login.rutas

from app.login.rutas import cambio_de_clave
