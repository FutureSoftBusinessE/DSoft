from flask import Blueprint

bp = Blueprint("SecuenciasDoc", __name__)

from app.SecuenciasDoc.rutas import getAllSecuenciasDoc, createSecuenciasDoc, updateSecuenciasDoc, eliminarSecuenciasDoc, getDocumentos, getModulos, getListaLocalidades
