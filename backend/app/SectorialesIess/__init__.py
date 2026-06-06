# flake8: noqa
from flask import Blueprint


bp = Blueprint("SectorialesIess", __name__)

# APIS PARA EL CRUD
from app.SectorialesIess.rutas import getAllSectorialesIess
from app.SectorialesIess.rutas import createSectorialesIess
from app.SectorialesIess.rutas import eliminarSectorialesIess
from app.SectorialesIess.rutas import updateSectorialesIess
from app.SectorialesIess.rutas import validarSectorialesIessIMP
from app.SectorialesIess.rutas import insertarSectorialesIessIMP
