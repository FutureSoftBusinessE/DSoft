from flask import jsonify, request
from app.PlanesServicios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllPlanesServicios", methods=["POST"])
@jwt_required()
def getAllPlanesServicios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            allowed_columns = [
                {"ciacodigo": FILTER_VALUE_TYPE.STRING},
                {"invcodigo": FILTER_VALUE_TYPE.STRING},
                {"artcodigo": FILTER_VALUE_TYPE.STRING},
                {"artdescri": FILTER_VALUE_TYPE.STRING},
                {"artstatus": FILTER_VALUE_TYPE.STRING},
                {"artapliiva": FILTER_VALUE_TYPE.NUMBER},
                {"artprecventa1": FILTER_VALUE_TYPE.NUMBER},
                {"artfecisys": FILTER_VALUE_TYPE.DATETIME},
                {"arthorisys": FILTER_VALUE_TYPE.DATETIME},
                {"artusuisys": FILTER_VALUE_TYPE.STRING},
                {"artfecmsys": FILTER_VALUE_TYPE.DATETIME},
                {"arthormsys": FILTER_VALUE_TYPE.DATETIME},
                {"artusumsys": FILTER_VALUE_TYPE.STRING},
            ]

            # MODIFICADO: Agregar JOIN con siacsritarifaiva y seleccionar descripción y porcentaje
            base_query = f"""
            SELECT
                i.ciacodigo,
                i.invcodigo,
                i.artcodigo,
                i.artdescri,
                i.artstatus,
                i.artapliiva,
                i.artprecventa1,
                i.artfecisys,
                i.arthorisys,
                i.artusuisys,
                i.artfecmsys,
                i.arthormsys,
                i.artusumsys,
                ISNULL(t.descripcion, 'No especificada') as tarifa_iva_descripcion,
                ISNULL(t.porcentaje, 0) as tarifa_iva_porcentaje,
                ISNULL(t.codigo, '') as tarifa_iva_codigo
            FROM inmart i
            LEFT JOIN siacsritarifaiva t
                ON CAST(i.artapliiva AS VARCHAR(2)) = t.codigo
            WHERE i.ciacodigo = '{sCodCia}'
            """

            # Construir consulta paginada con filtros usando la función auxiliar
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "artcodigo DESC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0
            # Crear lista de diccionarios excluyendo "total" directamente
            all_planes_result = [{**{key: value for key, value in dict(row).items() if key != "total"}} for row in result]

            # Garantizar que artprecventa1 siempre sea número
            for row in all_planes_result:
                if "artprecventa1" in row:
                    if row["artprecventa1"] is None:
                        row["artprecventa1"] = 0.0
                    else:
                        try:
                            row["artprecventa1"] = float(row["artprecventa1"])
                        except (ValueError, TypeError):
                            row["artprecventa1"] = 0.0

                # Garantizar que artapliiva sea entero
                if "artapliiva" in row:
                    if row["artapliiva"] is None:
                        row["artapliiva"] = 0
                    else:
                        try:
                            row["artapliiva"] = int(row["artapliiva"])
                        except (ValueError, TypeError):
                            row["artapliiva"] = 0

                # Garantizar que tarifa_iva_porcentaje sea float
                if "tarifa_iva_porcentaje" in row:
                    if row["tarifa_iva_porcentaje"] is None:
                        row["tarifa_iva_porcentaje"] = 0.0
                    else:
                        try:
                            row["tarifa_iva_porcentaje"] = float(row["tarifa_iva_porcentaje"])
                        except (ValueError, TypeError):
                            row["tarifa_iva_porcentaje"] = 0.0

    return (
        jsonify(
            {
                "data": all_planes_result,
                "total": total_records,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_records + per_page - 1) // per_page,
            }
        ),
        200,
    )
