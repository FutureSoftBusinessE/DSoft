# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("GestionAlmacenProcesos", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# APIS PARA EL CRUD
from app.GestionAlmacenProcesos.rutas import getAllProcesos
from app.GestionAlmacenProcesos.rutas import deleteProceso
from app.GestionAlmacenProcesos.rutas import createProceso
from app.GestionAlmacenProcesos.rutas import getProceso
from app.GestionAlmacenProcesos.rutas import updateProceso

# from app.BancoDePreguntas.rutas import deleteBancoDePregunta
# from app.BancoDePreguntas.rutas import createBancoDePregunta
# from app.BancoDePreguntas.rutas import getSpecificBancoDePreguntas
# from app.BancoDePreguntas.rutas import editarSpecificBancoDePregunta
