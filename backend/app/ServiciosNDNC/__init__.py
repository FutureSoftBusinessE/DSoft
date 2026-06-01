from flask import Blueprint

bp = Blueprint("ServiciosNDNC", __name__)

from app.ServiciosNDNC.rutas import getAllServiciosNDNC, createServiciosNDNC, updateServiciosNDNC, eliminarServiciosNDNC, validarServiciosNDNCIMP, insertarServiciosNDNCIMP
