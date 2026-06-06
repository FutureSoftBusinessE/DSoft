# flake8: noqa
from flask import jsonify, request, render_template

from app.productos import bp
from app.extensions import db
from app.models.siacopc import Siacopc


@bp.route("/")
def index():
    return "siacopc/"
