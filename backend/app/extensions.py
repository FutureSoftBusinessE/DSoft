# flake8: noqa
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from flask_marshmallow import Marshmallow

ma = Marshmallow()

from sqlalchemy import PrimaryKeyConstraint
from flask_cors import CORS

cors = CORS()

from flask_jwt_extended import JWTManager

jwt = JWTManager()
