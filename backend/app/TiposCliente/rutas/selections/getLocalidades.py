from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.TiposCliente import bp
from app.db import get_session
from app.extensions import db
from app.Clases.SEARCH_TYPE_HELPER import SEARCH_TYPE_HELPER
from error_handling import ValidationError


@bp.route("/getLocalidades", methods=["POST"])
@cross_origin()
@jwt_required()
def getLocalidades():
    claims = get_jwt()
    clicianonBD = claims.get("seleccion", {}).get("clicianonBD")
    sCodCia = claims.get("seleccion", {}).get("cliciaciacodigo")

    if not clicianonBD or not sCodCia:
        raise ValidationError("Parámetros de compañía faltantes en el token")

    data = request.get_json() or {}
    typeSearch = data.get("typeSearch", SEARCH_TYPE_HELPER.FILTER_TABLE_SEARCH)
    try:
        page = int(data.get("page", 1))
        perPage = int(data.get("perPage", 10))
    except (TypeError, ValueError):
        page = 1
        perPage = 10

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            if typeSearch == SEARCH_TYPE_HELPER.ID_SEARCH:
                loccodigo = (data.get("loccodigo") or "").strip()
                if not loccodigo:
                    raise ValidationError("Código de localidad vacío")

                query = text(
                    """
                    SELECT ciacodigo, loccodigo, locdescri
                    FROM cgblocal
                    WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo
                    """
                )
                row = connection.execute(query, {"ciacodigo": sCodCia, "loccodigo": loccodigo}).mappings().fetchone()

                if row:
                    return jsonify({"data": dict(row)})
                else:
                    raise ValidationError(f"Localidad no encontrada: {loccodigo}")

            else:
                # Count total
                count_query = text(
                    """
                    SELECT COUNT(*) as total
                    FROM cgblocal
                    WHERE ciacodigo = :ciacodigo AND locstatus = 'A'
                    """
                )
                total = connection.execute(count_query, {"ciacodigo": sCodCia}).scalar() or 0

                offset = max(0, (page - 1) * perPage)
                query = text(
                    """
                    SELECT ciacodigo, loccodigo, locdescri
                    FROM cgblocal
                    WHERE ciacodigo = :ciacodigo AND locstatus = 'A'
                    ORDER BY loccodigo
                    OFFSET :offset ROWS
                    FETCH NEXT :limit ROWS ONLY
                    """
                )
                rows = connection.execute(query, {"ciacodigo": sCodCia, "limit": perPage, "offset": offset}).mappings().fetchall()

                data_result = [dict(row) for row in rows]
                total_pages = (int(total) + perPage - 1) // perPage if perPage > 0 else 0

                return jsonify({"data": data_result, "total": int(total), "total_pages": total_pages, "page": page, "perPage": perPage})

    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(f"Error obteniendo localidades: {str(e)}")
