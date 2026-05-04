from flask import jsonify, request
from app.CreacionCliente import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getAllClientes", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllClientes():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

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
                {"clicodigo": FILTER_VALUE_TYPE.STRING},
                {"cliruc": FILTER_VALUE_TYPE.STRING},
                {"clinombre": FILTER_VALUE_TYPE.STRING},
                {"clitelef1": FILTER_VALUE_TYPE.STRING},
                {"cliemail": FILTER_VALUE_TYPE.STRING},
                {"clidirec": FILTER_VALUE_TYPE.STRING},
                {"cliestciv": FILTER_VALUE_TYPE.STRING},
            ]

            # Consulta base - SOLO CAMPOS RELEVANTES
            base_query = """
                SELECT
                    clicodigo,
                    clinombre,
                    cliruc,
                    cliestciv,
                    clisexo,
                    clitelef1,
                    cliemail,
                    clidirec,
                    clifecisys,
                    clifecmsys,
                    clistatus
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
            """

            # Construir consulta paginada con filtros
            # Ordenar por fecha de modificación descendente (más recientes primero)
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=[
                    "clifecmsys DESC",  # Fecha modificación descendente
                    "clifecisys DESC",  # Fecha creación descendente
                ],
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # Añadir parámetro fijo ciacodigo
            params.update({"ciacodigo": ciacodigo})

            # Ejecutar consulta
            result = connection.execute(text(final_query), params).mappings().fetchall()

            # Procesar resultado
            total_records = result[0]["total"] if result else 0

            # Formatear datos para respuesta
            all_clientes_result = []
            for row in result:
                cliente_dict = dict(row)

                # Formatear fechas de creación
                if cliente_dict.get("clifecisys"):
                    cliente_dict["clifecisys"] = cliente_dict["clifecisys"].strftime("%Y-%m-%d")
                else:
                    cliente_dict["clifecisys"] = ""

                # Formatear fechas de modificación
                if cliente_dict.get("clifecmsys"):
                    cliente_dict["clifecmsys"] = cliente_dict["clifecmsys"].strftime("%Y-%m-%d")
                else:
                    cliente_dict["clifecmsys"] = ""

                # Estado más descriptivo
                if cliente_dict.get("clistatus") == "A":
                    cliente_dict["cliestado_desc"] = "Activo"
                    cliente_dict["cliestado_color"] = "success"
                elif cliente_dict.get("clistatus") == "I":
                    cliente_dict["cliestado_desc"] = "Inactivo"
                    cliente_dict["cliestado_color"] = "error"
                else:
                    cliente_dict["cliestado_desc"] = cliente_dict.get("clistatus", "")
                    cliente_dict["cliestado_color"] = "default"

                # Sexo descriptivo
                if cliente_dict.get("clisexo") == "M":
                    cliente_dict["clisexo_desc"] = "Masculino"
                elif cliente_dict.get("clisexo") == "F":
                    cliente_dict["clisexo_desc"] = "Femenino"
                else:
                    cliente_dict["clisexo_desc"] = "No especificado"

                # Estado civil descriptivo
                estado_civil_map = {"SOLTERO": "Soltero/a", "CASADO": "Casado/a", "DIVORCIADO": "Divorciado/a", "VIUDO": "Viudo/a", "UNION LIBRE": "Unión Libre"}
                cliestciv = cliente_dict.get("cliestciv", "")
                cliente_dict["cliestciv_desc"] = estado_civil_map.get(cliestciv, cliestciv)

                # Excluir campo "total" si existe
                cliente_dict.pop("total", None)

                all_clientes_result.append(cliente_dict)

    return jsonify({"data": all_clientes_result, "total": total_records, "page": page, "per_page": per_page, "total_pages": (total_records + per_page - 1) // per_page}), 200
