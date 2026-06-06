from flask import Blueprint


bp = Blueprint("AccesoACompaniasYModulos", __name__)


from app.AccesoACompañiasYModulos.rutas import getAllAccesos
from app.AccesoACompañiasYModulos.rutas import getAllUsuarios
from app.AccesoACompañiasYModulos.rutas import getAllInfoModalAccesos
from app.AccesoACompañiasYModulos.rutas import saveAccesos
