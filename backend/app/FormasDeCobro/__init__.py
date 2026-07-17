# flake8: noqa
from flask import Blueprint


bp = Blueprint("FormasDeCobro", __name__)


# APIS PARA EL CRUD
from app.FormasDeCobro.rutas import createFormasDeCobro
from app.FormasDeCobro.rutas import eliminarFormasDeCobro
from app.FormasDeCobro.rutas import updateFormasDeCobro
from app.FormasDeCobro.rutas import getAllFormasDeCobro
from app.FormasDeCobro.rutas import validarFormasDeCobroIMP
from app.FormasDeCobro.rutas import insertarFormasDeCobroIMP
