# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("BancoDeTareas", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA LA OPCION CREAR

# from app.BancoDeTareas.rutas import getAllBancoDePreguntas
# from app.BancoDeTareas.rutas import deleteBancoDePregunta
# from app.BancoDeTareas.rutas import createBancoDePregunta
# from app.BancoDeTareas.rutas import getSpecificBancoDePreguntas
# from app.BancoDeTareas.rutas import editarSpecificBancoDePregunta


from app.BancoDeTareas.rutas import getAllBancoDeTareas
from app.BancoDeTareas.rutas import deleteBancoDeTarea
from app.BancoDeTareas.rutas import createBancoDeTarea
from app.BancoDeTareas.rutas import getSpecificBancoDeTareas
from app.BancoDeTareas.rutas import editarSpecificBancoDeTarea
from app.BancoDeTareas.rutas import getInstituciones
