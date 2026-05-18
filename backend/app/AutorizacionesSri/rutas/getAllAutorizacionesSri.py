from flask import jsonify, request
from app.AutorizacionesSri import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE

@bp.route("/getAllAutorizacionesSri", methods=["POST"])
@cross_origin()
@jwt_required()
def getAllAutorizacionesSri():
    claims = get_jwt()
    
    # 1. EXTRACCIÓN DE IDENTIDAD Y BASE DE DATOS
    # Sin @api_endpoint para no alterar la respuesta cruda requerida por la tabla
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = str(seleccion["cliciaciacodigo"]).strip()[:2]
    except KeyError:
        return jsonify({"error": "Sesión inválida o incompleta. No se encontró la compañía."}), 401

    # 2. PARÁMETROS DE PAGINACIÓN Y FILTROS DEL FRONTEND
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    filters = data.get("filters", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. DEFINIR COLUMNAS PERMITIDAS PARA BÚSQUEDA EN LA GRILLA
            allowed_columns = [
                {"sripreauto": FILTER_VALUE_TYPE.STRING},
                {"sriautnumero": FILTER_VALUE_TYPE.STRING},
                {"sritramite": FILTER_VALUE_TYPE.STRING},
            ]

            # 4. CONSULTA BASE FILTRADA POR COMPAÑÍA
            # Convertimos las fechas a formato estándar YYYY-MM-DD para evitar errores JSON
            base_query = f"""
            SELECT
                ciacodigo,
                sripreauto,
                sriautnumero,
                sritramite,
                sriautnumeroold,
                CONVERT(varchar, sriautfecemi, 23) AS sriautfecemi,
                CONVERT(varchar, sriautfecven, 23) AS sriautfecven,
                sritramitexml,
                sriultimotramite,
                srifecisys,
                sriusuisys,
                srifecmsys,
                sriusumsys
            FROM siacsrinumero
            WHERE ciacodigo = '{sCodCia}'
            """

            # 5. CONSTRUCCIÓN DE LA CONSULTA PAGINADA
            final_query, params = build_paginated_query(
                base_query=base_query,
                order_by=["sriautfecemi DESC"], # Ordenamos por defecto desde el más reciente
                filters=filters,
                page=page,
                per_page=per_page,
                allowed_columns=allowed_columns,
            )

            # 6. EJECUCIÓN
            result = connection.execute(text(final_query), params).mappings().fetchall()

            total_records = result[0]["total"] if result else 0
            
            # 7. PROCESAMIENTO DE DATOS Y CONVERSIÓN DE DECIMALES
            data_result = []
            for row in result:
                row_dict = dict(row)
                
                # Limpiamos el campo 'total' de la ventana particionada
                if "total" in row_dict:
                    del row_dict["total"]
                
                # Los campos DECIMAL(18,0) en BD llegan como Decimal() a Python, lo cual rompe JSON.
                # Se castean explícitamente a int para evitar el Type Error:
                if "sriautnumero" in row_dict:
                    row_dict["sriautnumero"] = int(row_dict.get("sriautnumero") or 0)
                if "sriautnumeroold" in row_dict:
                    row_dict["sriautnumeroold"] = int(row_dict.get("sriautnumeroold") or 0)
                    
                data_result.append(row_dict)

    # 8. RETORNO ESTRUCTURADO PARA COMPATIBILIDAD CON CustomConditionalActionsTableServerSide
    return jsonify({
        "data": data_result,
        "total": total_records,
        "page": page,
        "per_page": per_page,
        "total_pages": (total_records + per_page - 1) // per_page,
    }), 200