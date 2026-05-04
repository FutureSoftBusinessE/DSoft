# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("filter", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})


# from app.filter import get_filter
from app.filter import get_marcas
from app.filter import get_medidas
from app.filter import get_presentacion
from app.filter import get_producto
from app.filter import make_filter
from app.filter import make_filter_with_image
from app.filter import getAny
