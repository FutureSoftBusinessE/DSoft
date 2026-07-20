# flake8: noqa
from flask import Blueprint


bp = Blueprint("ActualizaClaveOlvidada", __name__)


from app.ActualizaClaveOlvidada.getAllUsuarios import getAllUsuarios
from app.ActualizaClaveOlvidada.restablecerClave import restablecerClave
