# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("ActualizaClaveFechaCaducidadLote", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})


from app.ActualizaClaveFechaCaducidadLote.getAllUsuarios import getAllUsuarios
from app.ActualizaClaveFechaCaducidadLote.saveFechaCaducidadLote import saveFechaCaducidadLote
