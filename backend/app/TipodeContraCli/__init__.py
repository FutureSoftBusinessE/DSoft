from flask import Blueprint

bp = Blueprint("TipodeContraCli", __name__)

from app.TipodeContraCli.rutas import getAllTipodeContraCli, createTipodeContraCli, updateTipodeContraCli, eliminarTipodeContraCli, validarTipodeContraCliIMP, insertarTipodeContraCliIMP
