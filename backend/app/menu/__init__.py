# flake8: noqa
from flask import Blueprint


bp = Blueprint("menu", __name__)


# from app.menu.deprecated import get_menu
from app.menu import get_menu_by_parent
from app.menu import get_menu_drawer
from app.menu import get_menu_opciones_acciones
