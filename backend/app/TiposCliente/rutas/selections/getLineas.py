from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.TiposCliente import bp
from app.db import get_session
from app.extensions import db
from app.Clases.SEARCH_TYPE_HELPER import SEARCH_TYPE_HELPER
from error_handling import ValidationError


@bp.route("/getLineas", methods=["POST"])
@cross_origin()
@jwt_required()
def getLineas():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json() or {}
    typeSearch = data.get("typeSearch", SEARCH_TYPE_HELPER.FILTER_TABLE_SEARCH)
    page = data.get("page", 1)
    perPage = data.get("perPage", 10)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            if typeSearch == SEARCH_TYPE_HELPER.ID_SEARCH:
                # Search by code: lincodigo
                lincodigo = data.get("lincodigo", "").strip()
                query = text(
                    """
                    SELECT ciacodigo, lincodigo, lindescri, lintipo
                    FROM inblin
                    WHERE ciacodigo = :ciacodigo AND lincodigo = :lincodigo
                    """
                )
                row = connection.execute(query, {"ciacodigo": sCodCia, "lincodigo": lincodigo}).mappings().fetchone()

                if row:
                    return jsonify({"data": dict(row)})
                else:
                    raise ValidationError(f"Línea no encontrada: {lincodigo}")

            else:  # FILTER_TABLE_SEARCH
                # Count total
                count_query = text(
                    """
                    SELECT COUNT(*) as total
                    FROM inblin
                    WHERE ciacodigo = :ciacodigo
                    """
                )
                total = connection.execute(count_query, {"ciacodigo": sCodCia}).scalar()

                # Fetch paginated data
                offset = (page - 1) * perPage
                query = text(
                    """
                    SELECT ciacodigo, lincodigo, lindescri, lintipo
                    FROM inblin
                    WHERE ciacodigo = :ciacodigo
                    ORDER BY lincodigo
                    OFFSET :offset ROWS
                    FETCH NEXT :limit ROWS ONLY
                    """
                )
                rows = connection.execute(query, {"ciacodigo": sCodCia, "limit": perPage, "offset": offset}).mappings().fetchall()

                data_result = [dict(row) for row in rows]
                total_pages = (total + perPage - 1) // perPage

                return jsonify({"data": data_result, "total": total, "total_pages": total_pages, "page": page, "perPage": perPage})

    except Exception as e:
        raise ValidationError(f"Error obteniendo líneas: {str(e)}")
