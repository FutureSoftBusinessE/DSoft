from flask import jsonify, request
from app.FacturaDesdeArticulosDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.calcular_metricas_productos import calcular_metricas_productos
from datetime import datetime
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError, APIError


@bp.route("/anularFactura", methods=["POST"])
@jwt_required()
@api_endpoint
def anularFactura():
    """Anular una factura (cambiar status a 'A' en facfac y fatfac)"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()

    facnumfac = data.get("facnumfac")
    loccodigo_param = data.get("loccodigo", loccodigo)
    ciacodigo_param = data.get("ciacodigo", ciacodigo)

    if not facnumfac:
        raise ValidationError("Número de factura requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 1. Verificar que la factura exista
            query_verificar = """
                SELECT facstatus, facnumfac
                FROM facfac
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND facnumfac = :facnumfac
            """

            factura_existente = connection.execute(text(query_verificar), {"ciacodigo": ciacodigo_param, "loccodigo": loccodigo_param, "facnumfac": facnumfac}).mappings().first()

            if not factura_existente:
                raise NotFoundError(f"Factura {facnumfac} no encontrada")

            # 2. Cambiar status a 'A' en CABECERA (facfac)
            sql_anular_cabecera = """
                UPDATE facfac
                SET facstatus = 'A'
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND facnumfac = :facnumfac
            """

            connection.execute(text(sql_anular_cabecera), {"ciacodigo": ciacodigo_param, "loccodigo": loccodigo_param, "facnumfac": facnumfac})

            # 3. Cambiar status a 'A' en DETALLES (fatfac)
            sql_anular_detalles = """
                UPDATE fatfac
                SET facstatus = 'A'
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND facnumfac = :facnumfac
            """

            connection.execute(text(sql_anular_detalles), {"ciacodigo": ciacodigo_param, "loccodigo": loccodigo_param, "facnumfac": facnumfac})

    return {"success": True, "message": f"Factura {facnumfac} anulada exitosamente", "facnumfac": facnumfac}
