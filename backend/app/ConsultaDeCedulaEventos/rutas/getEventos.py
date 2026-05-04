from flask import jsonify, request
from app.ConsultaDeCedulaEventos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from services.encrip_desencrip import encriptar, desencriptar
from datetime import datetime
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE


@bp.route("/getEventos", methods=["POST"])
@cross_origin()
@jwt_required()
def getPlanVsEjeData():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo_claim = claims["user"]
    loccodigo_claim = claims["localidad"]["loccodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    page = int(data.get("page", 1))
    per_page = int(data.get("perPage", 10))
    external_filters = data.get("externalFilters", {})

    # Obtener filtros externos específicos para PlanVsEje
    rango_fecha_external = external_filters.get("rangoFecha", [])
    loccodigo_external = external_filters.get("loccodigo", "")
    usrcodigo_external = external_filters.get("usrcodigo", "")
    procesocod_external = external_filters.get("procesocod", "")
    eventocodigo_external = external_filters.get("eventocodigo", "")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Determinar qué usuarios puede ver el usuario actual
            usuarios_permitidos = []

            # Verificar si el usuario es gerente
            is_gerente_flag = False
            is_gerente_query = """
            SELECT
                usrcodigo, usrflagger
            FROM
                siactloc
            WHERE
                usrcodigo = :usrcodigo
                AND ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
            """
            is_gerente_result = connection.execute(text(is_gerente_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo_claim, "usrcodigo": encriptar(usrcodigo_claim)}).mappings().fetchone()

            if is_gerente_result:
                is_gerente_result = dict(is_gerente_result)
                if is_gerente_result["usrflagger"] != 0:
                    is_gerente_flag = True

            # Si el usuario NO es gerente, obtener solo sus usuarios asignados
            if not is_gerente_flag:
                query_allusr = """
                    SELECT usrcodigo
                    FROM siaccusr
                    WHERE usrcodigoreporta = :usrcodigo
                """
                result_allusr = connection.execute(text(query_allusr), {"usrcodigo": usrcodigo_claim}).mappings().fetchall()

                # Obtener todos los usrcodigo de los resultados (ya encriptados de la BD)
                usuarios_permitidos = [row["usrcodigo"] for row in result_allusr]

            # Siempre incluir al usuario actual (encriptado)
            usuarios_permitidos.append(encriptar(usrcodigo_claim))

            # Construir cláusulas WHERE para filtros externos
            where_clauses_external = []
            params_external = {}

            # Filtro por rango de fecha (usando eventofecha o fechaEjecucionReal según preferencia)
            if rango_fecha_external and len(rango_fecha_external) == 2:
                fecha_inicio_str = rango_fecha_external[0]
                fecha_fin_str = rango_fecha_external[1]

                if fecha_inicio_str and fecha_fin_str:
                    try:
                        fecha_inicio = datetime.strptime(fecha_inicio_str, "%Y-%m-%dT%H:%M:%S.%fZ").date()
                        fecha_fin = datetime.strptime(fecha_fin_str, "%Y-%m-%dT%H:%M:%S.%fZ").date()

                        where_clauses_external.append("CAST(eventofecha AS DATE) BETWEEN :fecha_inicio_ext AND :fecha_fin_ext")
                        params_external["fecha_inicio_ext"] = fecha_inicio
                        params_external["fecha_fin_ext"] = fecha_fin
                    except ValueError:
                        # Si el formato es diferente
                        where_clauses_external.append("eventofecha >= :fecha_inicio_ext AND eventofecha <= :fecha_fin_ext")
                        params_external["fecha_inicio_ext"] = fecha_inicio_str
                        params_external["fecha_fin_ext"] = fecha_fin_str
                else:
                    # Caso que se pase un solo valor de fecha
                    fecha_str = fecha_inicio_str or fecha_fin_str
                    if fecha_str:
                        try:
                            fecha = datetime.strptime(fecha_str, "%Y-%m-%dT%H:%M:%S.%fZ").date()
                            where_clauses_external.append("CAST(eventofecha AS DATE) = :fecha_ext")
                            params_external["fecha_ext"] = fecha
                        except ValueError:
                            where_clauses_external.append("eventofecha = :fecha_ext")
                            params_external["fecha_ext"] = fecha_str

            # Filtro por localidad
            if loccodigo_external:
                where_clauses_external.append("loccodigo = :loccodigo_ext")
                params_external["loccodigo_ext"] = loccodigo_external

            # Filtro por usuario
            if usrcodigo_external:
                # Encriptar el usrcodigo para comparar con la BD
                usrcodigo_encriptado = encriptar(usrcodigo_external)

                # Si NO es gerente, verificar que el usuario esté en la lista permitida
                if not is_gerente_flag and usrcodigo_encriptado not in usuarios_permitidos:
                    # Si no tiene permisos, devolver array vacío
                    return jsonify({"data": [], "total": 0, "page": page, "per_page": per_page, "total_pages": 0}), 200

                where_clauses_external.append("usrcodigo = :usrcodigo_ext")
                params_external["usrcodigo_ext"] = desencriptar(usrcodigo_encriptado)
            else:
                # Si no se especifica usuario, filtrar por los usuarios permitidos
                if not is_gerente_flag:
                    where_clauses_external.append("usrcodigo IN :usuarios_permitidos_ext")
                    usuarios_desencriptados = [desencriptar(u) for u in usuarios_permitidos]
                    # Pasamos la lista transformada como una tupla a los parámetros
                    params_external["usuarios_permitidos_ext"] = tuple(usuarios_desencriptados)

                # Si es gerente, no se aplica filtro por usuario

            # Filtro por proceso
            if procesocod_external:
                where_clauses_external.append("procesocod = :procesocod_ext")
                params_external["procesocod_ext"] = procesocod_external

            # Filtro por evento
            if eventocodigo_external:
                where_clauses_external.append("eventocodigo = :eventocodigo_ext")
                params_external["eventocodigo_ext"] = eventocodigo_external

            # Construir consulta base
            base_query = """
            SELECT
                loccodigo,
                locdescri,
                eventocodigo,
                usrcodigo,
                usrnombre,
                procesocod,
                formsecuen,
                pregdescri,
                clinombre,
                eventofecha,
                eventosecuen,
                comentario,
                statusnuevo,
                fechaEjecucionReal,
                ejechoraAnt,
                minutoslab,
                porcentajeavance,
                mmPlanificada
            FROM
                view_gdoc_PlanVsEje
            WHERE
                ciacodigo = :ciacodigo
            """

            # Agregar condiciones WHERE de filtros externos
            if where_clauses_external:
                base_query += " AND " + " AND ".join(where_clauses_external)

            # Orden por defecto
            order_by = ["eventofecha DESC", "eventocodigo ASC", "formsecuen ASC", "eventosecuen ASC"]
            base_query += " ORDER BY " + ", ".join(order_by)

            # Parámetros fijos
            params_fixed = {"ciacodigo": ciacodigo}

            # Combinar parámetros
            params = {}
            params.update(params_fixed)
            params.update(params_external)

            # Ejecutar consulta
            result = connection.execute(text(base_query), params).mappings().fetchall()

            # Procesar resultado
            plan_vs_eje_result = [dict(row) for row in result]

            # Convertir fechas a string para JSON
            for item in plan_vs_eje_result:
                for key in ["eventofecha", "fechaEjecucionReal", "ejechoraAnt"]:
                    if item.get(key) and isinstance(item[key], datetime):
                        item[key] = item[key].isoformat()

            return (
                jsonify(
                    {
                        "data": plan_vs_eje_result,
                    }
                ),
                200,
            )
