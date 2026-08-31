from flask import jsonify, request
from app.ResumenProductividad import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from services.encrip_desencrip import encriptar, desencriptar
from datetime import datetime


@bp.route("/getAllInfo", methods=["POST"])
@jwt_required()
def getAllInfo():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo_claim = claims["user"]
    loccodigo_claim = claims["localidad"]["loccodigo"]

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    external_filters = data.get("externalFilters", {})

    # Obtener filtros externos específicos (SOLO USUARIO)
    usrcodigo_external = external_filters.get("usrcodigo", "")

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

            # Filtro por usuario (ÚNICO FILTRO DISPONIBLE)
            if usrcodigo_external:
                # Encriptar el usrcodigo para comparar con la BD
                usrcodigo_encriptado = encriptar(usrcodigo_external)

                # Si NO es gerente, verificar que el usuario esté en la lista permitida
                if not is_gerente_flag and usrcodigo_encriptado not in usuarios_permitidos:
                    # Si no tiene permisos, devolver array vacío
                    return jsonify({"data": []}), 200

                where_clauses_external.append("CodigoUsuario = :usrcodigo_ext")
                params_external["usrcodigo_ext"] = desencriptar(usrcodigo_encriptado)
            else:
                # Si no se especifica usuario, filtrar por los usuarios permitidos
                if not is_gerente_flag:
                    where_clauses_external.append("CodigoUsuario IN :usuarios_permitidos_ext")
                    usuarios_desencriptados = [desencriptar(u) for u in usuarios_permitidos]
                    # Pasamos la lista transformada como una tupla a los parámetros
                    params_external["usuarios_permitidos_ext"] = tuple(usuarios_desencriptados)

                # Si es gerente, no se aplica filtro por usuario (ve todos)

            # Construir consulta base (SIN ciacodigo porque la vista no lo tiene)
            base_query = """
            SELECT
                CodigoUsuario,
                NombreUsuario,
                Cliente,
                AnioEvento,
                MesEvento,
                TareasCompletadas,
                Planificado_Efectivo,
                Ejecutado_Efectivo,
                BalanceEficiencia,
                TareasInterrumpidas,
                MinutosPerdidos,
                TareasActivas
            FROM
                view_gdoc_PlanVsEjeResumeUsuCli
            """

            # Agregar condiciones WHERE de filtros externos
            if where_clauses_external:
                base_query += " WHERE " + " AND ".join(where_clauses_external)

            # Orden por defecto
            order_by = ["AnioEvento DESC", "MesEvento DESC", "NombreUsuario ASC", "Cliente ASC"]
            base_query += " ORDER BY " + ", ".join(order_by)

            # Ejecutar consulta
            result = connection.execute(text(base_query), params_external).mappings().fetchall()

            # Procesar resultado
            data_result = [dict(row) for row in result]

            return (
                jsonify(
                    {
                        "data": data_result,
                    }
                ),
                200,
            )
