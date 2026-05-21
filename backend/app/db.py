# flake8: noqa
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from decouple import config as config_env


sesiones = {}


def create_session(name="SiacFSBS"):
    try:
        # todos estos valores los tomo del archivo backend\.env
        engine = create_engine("mssql+pymssql://" + config_env("DB_USER") + ":" + config_env("DB_PASS") + "@" + config_env("DB_SERVER") + ":" + config_env("DB_PORT") + "/" + name + "?charset=utf8")
        sesiones[name] = scoped_session(sessionmaker(bind=engine))
    except Exception as e:
        print(e)
        return None
    return sesiones[name]


# la funcion get_session tiene el parametro de la base de datos opcional pero el valor de defecto es SiacFSBS
def get_session(name="SiacFSBS"):
    if name not in sesiones:
        return create_session(name)
    return sesiones[name]


create_session("SiacFSBS")
