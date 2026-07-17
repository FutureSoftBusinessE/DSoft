# flake8: noqa
from flask import Blueprint


bp = Blueprint("ExcepcionesdeIVA", __name__)

# APIS PARA EL CRUD
from app.ExcepcionesdeIVA.rutas import createExcepcionesdeIVA
from app.ExcepcionesdeIVA.rutas import eliminarExcepcionesdeIVA
from app.ExcepcionesdeIVA.rutas import getAllExcepcionesdeIVA
from app.ExcepcionesdeIVA.rutas import updateExcepcionesdeIVA
from app.ExcepcionesdeIVA.rutas import validarExcepcionesdeIVAIMP
from app.ExcepcionesdeIVA.rutas import insertarExcepcionesdeIVAIMP
from app.ExcepcionesdeIVA.rutas import GetListExcepcionesdeIVA
