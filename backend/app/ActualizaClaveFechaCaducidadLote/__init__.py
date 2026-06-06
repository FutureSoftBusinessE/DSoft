# flake8: noqa
from flask import Blueprint


bp = Blueprint("ActualizaClaveFechaCaducidadLote", __name__)


from app.ActualizaClaveFechaCaducidadLote.getAllUsuarios import getAllUsuarios
from app.ActualizaClaveFechaCaducidadLote.saveFechaCaducidadLote import saveFechaCaducidadLote
