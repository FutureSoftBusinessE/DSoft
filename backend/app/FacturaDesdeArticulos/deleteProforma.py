from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.calcular_metricas_productos import calcular_metricas_productos
from datetime import datetime
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError, APIError


@bp.route("/deleteProforma", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def deleteProforma():
    """Eliminar una proforma existente"""
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()

    pednumped = data.get("pednumped")
    loccodigo_param = data.get("loccodigo", loccodigo)
    ciacodigo_param = data.get("ciacodigo", ciacodigo)

    if not pednumped:
        raise ValidationError("Codigo de proforma requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 1. Verificar que la proforma exista y este pendiente
            query_verificar = """
                SELECT pedstatus, pednumped
                FROM facped
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            proforma_existente = connection.execute(text(query_verificar), {"ciacodigo": ciacodigo_param, "loccodigo": loccodigo_param, "pednumped": pednumped}).mappings().first()

            if not proforma_existente:
                raise NotFoundError(f"Proforma {pednumped} no encontrada")

            if proforma_existente["pedstatus"] != "P":
                raise ValidationError("Solo se pueden eliminar proformas pendientes")

            # 2. Eliminar detalles de fatped
            sql_delete_detalles = """
                DELETE FROM fatped
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            connection.execute(text(sql_delete_detalles), {"ciacodigo": ciacodigo_param, "loccodigo": loccodigo_param, "pednumped": pednumped})

            # 3. Eliminar cabecera de facped
            sql_delete_cabecera = """
                DELETE FROM facped
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND pednumped = :pednumped
            """

            connection.execute(text(sql_delete_cabecera), {"ciacodigo": ciacodigo_param, "loccodigo": loccodigo_param, "pednumped": pednumped})

            return {"success": True, "message": "Proforma eliminada exitosamente", "pednumped": pednumped}
