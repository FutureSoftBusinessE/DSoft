# flake8: noqa
from flask import Blueprint


bp = Blueprint("BancoDeTareas", __name__)


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
