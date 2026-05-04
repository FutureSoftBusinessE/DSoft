# flake8: noqa
import os
from dotenv import load_dotenv
from decouple import config as config_env


basedir = os.path.abspath(os.path.dirname(__file__))

load_dotenv()


class Config:

    SECRET_KEY = config_env("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = "mssql+pymssql://" + config_env("DB_USER") + ":" + config_env("DB_PASS") + "@" + config_env("DB_SERVER") + ":" + config_env("DB_PORT") + "/?charset=utf8"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
