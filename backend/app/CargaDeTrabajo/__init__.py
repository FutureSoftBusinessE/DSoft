from flask import Blueprint
from flask_cors import CORS


bp = Blueprint("CargaDeTrabajo", __name__)
cors = CORS(
    bp,
    resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
)

from app.CargaDeTrabajo.rutas import getAllInfo
