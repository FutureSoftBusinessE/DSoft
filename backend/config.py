import os
from dotenv import load_dotenv
from decouple import config as config_env

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Obtener ruta base del proyecto
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Clave secreta para la aplicación (obligatoria)
    SECRET_KEY = config_env("SECRET_KEY")

    # Configuración de conexión a SQL Server
    DB_USER = config_env("DB_USER")
    DB_PASS = config_env("DB_PASS")
    DB_SERVER = config_env("DB_SERVER")
    DB_PORT = config_env("DB_PORT")

    # Construcción segura de la cadena de conexión
    SQLALCHEMY_DATABASE_URI = f"mssql+pymssql://{DB_USER}:{DB_PASS}@{DB_SERVER}:{DB_PORT}/" "?charset=utf8"

    # Desactivar el seguimiento de modificaciones de SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False
