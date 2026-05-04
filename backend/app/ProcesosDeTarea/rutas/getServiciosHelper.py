from flask import jsonify, request
from app.ProcesosDeTarea import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import func, or_
from sqlalchemy import text
from app.Clases.SEARCH_TYPE_HELPER import SEARCH_TYPE_HELPER


@bp.route("/getServiciosHelper", methods=["POST"])
@cross_origin()
@jwt_required()
def getServiciosHelper():
    claims = get_jwt()
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    clicianonBD = claims["seleccion"]["clicianonBD"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    data = request.json
    typeSearch = data.get("typeSearch", None)

    if typeSearch == SEARCH_TYPE_HELPER.ID_SEARCH.value:
        params = {"ciacodigo": ciacodigo, "artcodigo": data.get("artcodigo")}

        sCriterio = "ciacodigo = :ciacodigo AND artcodigo = :artcodigo AND artprodven!=0 AND (artservicio !=0 or artexpins!=0)"
        query = f"""
           SELECT ciacodigo,
                artcodigo,
                artdescri
            FROM inmart
            AND artstatus ='A'
            WHERE {sCriterio}
        """

        with engine.connect() as connection:
            result = connection.execute(text(query), params).mappings().fetchone()
            result_dict = dict(result)

        return jsonify({"data": result_dict}), 200

    if typeSearch == SEARCH_TYPE_HELPER.FILTER_TABLE_SEARCH.value:
        page = data.get("page", 1)
        per_page = data.get("perPage", 10)  # Por defecto 10 items por página
        filters = data.get("filters", {})

        if not ciacodigo:
            return jsonify({"error": "ciacodigo is required"}), 400

        # Construcción de la consulta base
        query = """
            SELECT ciacodigo,
                artcodigo,
                artdescri
            FROM inmart
            WHERE ciacodigo = :ciacodigo
            AND artprodven!=0 AND (artservicio !=0 or artexpins!=0)
        """

        # Agregar filtros dinámicamente
        filter_clauses = [f"LOWER({column}) LIKE :filter_{column}" for column, value in filters.items() if value]
        if filter_clauses:
            query += " AND (" + " OR ".join(filter_clauses) + ")"

        # Preparar parámetros
        params = {"ciacodigo": ciacodigo}
        params.update({f"filter_{column}": f"%{value.lower()}%" for column, value in filters.items() if value})

        with engine.connect() as connection:
            # Obtener total de resultados
            count_query = """
                SELECT COUNT(*)
                FROM view_inmart
                WHERE ciacodigo = :ciacodigo
            """
            if filter_clauses:
                count_query += " AND (" + " OR ".join(filter_clauses) + ")"

            total = connection.execute(text(count_query), params).scalar()  # Usar .scalar() para obtener el total

            # Validar página
            total_pages = (total + per_page - 1) // per_page
            if page < 1 or page > total_pages:
                return jsonify({"error": "Page number out of range"}), 400

            # Calcular offset para paginación
            params["offset"] = (page - 1) * per_page  # Cálculo correcto del offset
            params["per_page"] = per_page  # Asegúrate de incluir per_page

            # Paginación y obtención de resultados
            paginated_query = f"{query} ORDER BY artdescri OFFSET :offset ROWS FETCH NEXT :per_page ROWS ONLY"
            results = connection.execute(text(paginated_query), params).mappings().fetchall()

        print(results)

        # Formato de resultado
        result = {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "data": [dict(row) for row in results],
        }

        return jsonify(result)

    return "error", 500
