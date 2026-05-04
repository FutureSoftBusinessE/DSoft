# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("menu", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})

# from app.menu.deprecated import get_menu
from app.menu import get_menu_by_parent
from app.menu import get_menu_drawer
from app.menu import get_menu_opciones_acciones
