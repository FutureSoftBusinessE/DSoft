from flask import jsonify, request
from app.ActualizaClaveFechaCaducidadLote import bp
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


@bp.route("/getAllUsuarios", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllUsuarios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    rango_fecha_vencimiento = data.get("rangoFechaVencimiento", [])  # Rango de fecha de vencimiento

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            base_query = """
            SELECT
                usrcodigo,
                usrnombre,
                usrfeccad,
                usremail,
                usrstatus,
                usrfecmsys,
                usrhormsys
            FROM siaccusr
            """

            where_clauses_external_filters = []
            params_external_filters = {}

            if rango_fecha_vencimiento and len(rango_fecha_vencimiento) == 2:
                fecha_vencimiento_inicio_str = rango_fecha_vencimiento[0]
                fecha_vencimiento_fin_str = rango_fecha_vencimiento[1]

                if fecha_vencimiento_inicio_str and fecha_vencimiento_fin_str:
                    # Convertir a objetos date
                    fecha_inicio = datetime.strptime(fecha_vencimiento_inicio_str, "%Y-%m-%dT%H:%M:%S.%fZ").date()
                    fecha_fin = datetime.strptime(fecha_vencimiento_fin_str, "%Y-%m-%dT%H:%M:%S.%fZ").date()

                    # Agregar condiciones con parámetros nombrados para usrfeccad (fecha de vencimiento)
                    where_clauses_external_filters.append("CAST(usrfeccad AS DATE) BETWEEN :fecha_vencimiento_inicio_ext AND :fecha_vencimiento_fin_ext")
                    # Agregar parámetros al diccionario
                    params_external_filters["fecha_vencimiento_inicio_ext"] = fecha_inicio
                    params_external_filters["fecha_vencimiento_fin_ext"] = fecha_fin

                elif fecha_vencimiento_inicio_str and not fecha_vencimiento_fin_str:
                    # Solo fecha inicio - usar >= (desde fecha inicio en adelante)
                    fecha_inicio = datetime.strptime(fecha_vencimiento_inicio_str, "%Y-%m-%dT%H:%M:%S.%fZ").date()

                    where_clauses_external_filters.append("CAST(usrfeccad AS DATE) >= :fecha_vencimiento_inicio_ext")
                    params_external_filters["fecha_vencimiento_inicio_ext"] = fecha_inicio

                elif not fecha_vencimiento_inicio_str and fecha_vencimiento_fin_str:
                    # Solo fecha fin - usar <= (hasta fecha fin)
                    fecha_fin = datetime.strptime(fecha_vencimiento_fin_str, "%Y-%m-%dT%H:%M:%S.%fZ").date()

                    where_clauses_external_filters.append("CAST(usrfeccad AS DATE) <= :fecha_vencimiento_fin_ext")
                    params_external_filters["fecha_vencimiento_fin_ext"] = fecha_fin

            # Combinar las cláusulas WHERE con los filtros adicionales
            if where_clauses_external_filters:
                base_query += " WHERE " + " AND ".join(where_clauses_external_filters)

            # Ejecutar la consulta con parámetros
            result = connection.execute(text(base_query), params_external_filters).mappings().fetchall()

            # Crear lista de diccionarios excluyendo "total" directamente
            all_usuarios_result = [
                {
                    **{key: value for key, value in dict(row).items() if key != "total"},
                    "usrcodigo": desencriptar(row["usrcodigo"]) if "usrcodigo" in row else None,
                    "usrnombre": desencriptar(row["usrnombre"]) if "usrnombre" in row else None,
                    "usrstatus": desencriptar(row["usrstatus"]) if "usrstatus" in row else None,
                }
                for row in result
            ]

    return jsonify({"data": all_usuarios_result}), 200
