from flask import jsonify, request
from app.PlanificacionVSEjecucionLabores import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime, date
import calendar
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError


@bp.route("/getInfoTable", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def getInfoTable():
    # Obtener claims del JWT
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    # Obtener parámetros de la solicitud
    data = request.get_json() or {}

    # Filtros específicos
    external_filters = data.get("externalFilters", {})
    loccodigo_filtro = external_filters.get("loccodigo", "")
    fecha_desde_filtro = external_filters.get("fechaDesde", "")
    fecha_hasta_filtro = external_filters.get("fechaHasta", "")
    emcodemp_filtro = external_filters.get("emcodemp", "")

    if not fecha_desde_filtro and not fecha_hasta_filtro:
        raise ValidationError("Necesita al menos especificar una fecha en los filtros de fecha")

    # Establecer conexión a la base de datos específica del cliente
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Consulta base - EXACTAMENTE lo que devuelve la vista
            query = """
            SELECT
                ciacodigo,
                emcodemp,
                usrcodigoseg,
                emapellido,
                emnombre,
                locdescri,
                loccodigo,
                hordescri,
                planfecha,
                horini,
                horfin,
                hordiaini,
                hordiafin,
                ejecnumero,
                ejechora,
                ejechoraAnt,
                minutoslab
            FROM view_rol_PlanVsEje WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
            """

            # Lista para condiciones WHERE adicionales
            where_conditions = []
            params = {"ciacodigo": ciacodigo}

            if emcodemp_filtro:  # Variable renombrada
                where_conditions.append("emcodemp = :emcodemp")
                params["emcodemp"] = emcodemp_filtro  # Usando la variable con _filtro

            if loccodigo_filtro:
                where_conditions.append("loccodigo LIKE :loccodigo")
                params["loccodigo"] = f"%{loccodigo_filtro}%"

            # Filtro de rango de fechas - usando fecha_desde_filtro y fecha_hasta_filtro
            if fecha_desde_filtro and fecha_hasta_filtro:
                where_conditions.append("CAST(planfecha AS DATE) BETWEEN :fecha_desde AND :fecha_hasta")
                params["fecha_desde"] = datetime.strptime(fecha_desde_filtro, "%Y-%m-%d").date()
                params["fecha_hasta"] = datetime.strptime(fecha_hasta_filtro, "%Y-%m-%d").date()
            elif fecha_desde_filtro:
                where_conditions.append("CAST(planfecha AS DATE) >= :fecha_desde")
                params["fecha_desde"] = datetime.strptime(fecha_desde_filtro, "%Y-%m-%d").date()
            elif fecha_hasta_filtro:
                where_conditions.append("CAST(planfecha AS DATE) <= :fecha_hasta")
                params["fecha_hasta"] = datetime.strptime(fecha_hasta_filtro, "%Y-%m-%d").date()

            # Agregar condiciones WHERE si existen
            if where_conditions:
                query += " AND " + " AND ".join(where_conditions)

            # Ordenamiento (opcional, si quieres ordenado)
            query += " ORDER BY planfecha DESC, emapellido, emnombre, ejechora"

            # Ejecutar consulta
            result = connection.execute(text(query), params).mappings().fetchall()

            # Convertir a lista de diccionarios (SIN ningún procesamiento adicional)
            data_result = [dict(row) for row in result]

            # Respuesta exitosa - SOLO devuelve los datos crudos
            return data_result
