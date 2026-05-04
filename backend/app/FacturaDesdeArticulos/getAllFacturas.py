from flask import jsonify, request
from app.FacturaDesdeArticulos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from services.encrip_desencrip import desencriptar
import base64


@bp.route("/getAllFacturas", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllFacturas():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Definir columnas permitidas para filtros
            allowed_columns = [
                {"ciacodigo": FILTER_VALUE_TYPE.STRING},
                {"pednumped": FILTER_VALUE_TYPE.STRING},
                {"loccodigo": FILTER_VALUE_TYPE.STRING},
                {"vencodigo": FILTER_VALUE_TYPE.STRING},
                {"nickname": FILTER_VALUE_TYPE.STRING},
                {"pedstatus": FILTER_VALUE_TYPE.STRING},
                {"pedestisys": FILTER_VALUE_TYPE.STRING},
                {"pedusuisys": FILTER_VALUE_TYPE.STRING},
            ]

            base_query = """
            SELECT
                ciacodigo,
                pednumped,
                loccodigo,
                vencodigo,
                nickname,
                pedfecemi,
                pedfecven,
                pedtivacer,
                pedtivapor,
                pedsubtot,
                pedpordes,
                peddesglobal,
                peddesdirecto,
                pedporiva,
                pedapliiva,
                pediva,
                pedtotal,
                pedstatus,
                pedfecisys,
                pedhorisys,
                pedusuisys,
                pedestisys,
                comentario,
                sesnumses,
                sesnumsesref,
                COUNT(*) OVER() as total
            FROM facpedweb
            """

            # Construir consulta paginada con filtros
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "pedfecisys DESC",
                    "pedhorisys DESC",
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0

            # Crear lista de diccionarios excluyendo "total"
            all_facturas_result = [
                {
                    **{key: value for key, value in dict(row).items() if key != "total"},
                    # Formatear fechas para que sean legibles
                    "pedfecemi": row["pedfecemi"].strftime("%Y-%m-%d %H:%M:%S") if row["pedfecemi"] else None,
                    "pedfecven": row["pedfecven"].strftime("%Y-%m-%d %H:%M:%S") if row["pedfecven"] else None,
                    "pedfecisys": row["pedfecisys"].strftime("%Y-%m-%d %H:%M:%S") if row["pedfecisys"] else None,
                    # Convertir valores decimales a float para JSON
                    "pedtivacer": float(row["pedtivacer"]) if row["pedtivacer"] else 0,
                    "pedtivapor": float(row["pedtivapor"]) if row["pedtivapor"] else 0,
                    "pedsubtot": float(row["pedsubtot"]) if row["pedsubtot"] else 0,
                    "pedpordes": float(row["pedpordes"]) if row["pedpordes"] else 0,
                    "peddesglobal": float(row["peddesglobal"]) if row["peddesglobal"] else 0,
                    "peddesdirecto": float(row["peddesdirecto"]) if row["peddesdirecto"] else 0,
                    "pedporiva": float(row["pedporiva"]) if row["pedporiva"] else 0,
                    "pediva": float(row["pediva"]) if row["pediva"] else 0,
                    "pedtotal": float(row["pedtotal"]) if row["pedtotal"] else 0,
                }
                for row in result
            ]

    return jsonify({"data": all_facturas_result, "total": total_records, "page": page, "per_page": per_page, "total_pages": (total_records + per_page - 1) // per_page}), 200
