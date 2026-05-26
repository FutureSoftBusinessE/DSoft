from flask import Blueprint

bp = Blueprint("Instituciones", __name__)

from app.Instituciones.rutas import getAllInstituciones, createInstituciones, updateInstituciones, eliminarInstituciones, validarInstitucionesIMP, insertarInstitucionesIMP
