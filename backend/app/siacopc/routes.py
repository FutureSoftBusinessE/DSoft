# flake8: noqa
from flask import jsonify, request, render_template
from flask_cors import cross_origin
from app.productos import bp
from app.extensions import db
from app.models.siacopc import Siacopc


@bp.route("/")
@cross_origin()
def index():
    return "siacopc/"
