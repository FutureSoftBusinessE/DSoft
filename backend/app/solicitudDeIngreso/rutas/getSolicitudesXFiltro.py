from flask import jsonify, request
import traceback
from flask_paginate import Pagination, get_page_parameter
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxpmprov import cxpmprov
from sqlalchemy import Date, distinct, exists, func, or_, cast, String, literal_column
from datetime import datetime
from app.models.intSgaSolIng import intSgaSolIng
from app.models.incSgaSolIng import incSgaSolIng
from app.models.cxcmcli import Cxcmcli
from app.models.producto import Producto as inmart
from app.models.view_inv_cabecera_solicitud_ingreso import view_inv_cabecera_solicitud_ingreso
from app.models.view_inv_detalle_solicitud_ingreso import view_inv_detalle_solicitud_ingreso


def apply_grilla_filters(query, filters):
    """
    Aplica filtros específicos de la grilla de Material-UI a la consulta.
    """
    for column, filter_value in filters.items():
        if filter_value:
            lower_filter_value = filter_value.lower()
            if column == "sgafecsol":
                # Convertir el filtro de '12/06/2024' a un objeto datetime compatible
                try:
                    filter_value = datetime.strptime(filter_value.split("T")[0], "%Y-%m-%d")
                    print(filter_value)
                    query = query.filter(view_inv_cabecera_solicitud_ingreso.sgafecsol == filter_value)
                except ValueError:
                    pass
            elif column == "sgafecllegada":
                # Convertir el filtro de '12/06/2024' a un objeto datetime compatible
                try:
                    filter_value = datetime.strptime(filter_value.split("T")[0], "%Y-%m-%d")
                    print(filter_value)
                    query = query.filter(view_inv_cabecera_solicitud_ingreso.sgafecsol == filter_value)
                except ValueError:
                    pass
            else:
                query = query.filter(
                    or_(
                        func.lower(getattr(view_inv_cabecera_solicitud_ingreso, column)).like(f"%{lower_filter_value}%"),
                    )
                )
    return query


@bp.route("/getSolicitudesXFiltro", methods=["POST"])
@cross_origin()
@jwt_required()
def getSolicitudesXFiltro():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        db.session = get_session(clicianonBD)

        data = request.get_json()
        page = int(data.get("page", 1))  # Convertir a entero
        per_page = int(data.get("per_page", 10))  # Convertir a entero
        filters = data.get("filters", {})

        # Filtros de búsqueda
        codSolicitud = data.get("codSolicitud", "")
        codProveedor = data.get("codProveedor", "")
        codCliente = data.get("codCliente", "")
        detalle = data.get("detalle", "")
        motivo = data.get("motivo", "")
        codArticulo = data.get("codArticulo", "")
        estado = data.get("estado", [])

        # Subconsulta para calcular la agregación
        detalles_agg = (
            db.session.query(
                view_inv_detalle_solicitud_ingreso.sgasoling,
                func.string_agg(
                    cast(view_inv_detalle_solicitud_ingreso.artcodigo, String("MAX")),
                    literal_column("','"),  # Asegurando que se pase el separador correcto
                ).label("articulos"),
            )
            .group_by(view_inv_detalle_solicitud_ingreso.sgasoling)
            .subquery()
        )

        clientes_agg = db.session.query(Cxcmcli.clicodigo, Cxcmcli.clinombre).filter(Cxcmcli.ciacodigo == ciacodigo).subquery()

        proveedor_agg = db.session.query(cxpmprov.procodigo, cxpmprov.pronombre).filter(cxpmprov.ciacodigo == ciacodigo).subquery()

        # Base de la consulta
        query_SolicitudIngresoBusqueda = (
            db.session.query(
                view_inv_cabecera_solicitud_ingreso.sgasoling,
                view_inv_cabecera_solicitud_ingreso.sgafecsol,
                view_inv_cabecera_solicitud_ingreso.sgahorsol,
                view_inv_cabecera_solicitud_ingreso.motdescripcion,
                view_inv_cabecera_solicitud_ingreso.sgafecllegada,
                view_inv_cabecera_solicitud_ingreso.sgahorllegada,
                view_inv_cabecera_solicitud_ingreso.sgacomenllegada,
                view_inv_cabecera_solicitud_ingreso.sgadescri,
                view_inv_cabecera_solicitud_ingreso.clicodigo,
                view_inv_cabecera_solicitud_ingreso.procodigo,
                view_inv_cabecera_solicitud_ingreso.sgagenepor,
                view_inv_cabecera_solicitud_ingreso.sgastatus,
                detalles_agg.c.articulos,
                clientes_agg.c.clinombre,
                proveedor_agg.c.pronombre,
            )
            .outerjoin(detalles_agg, detalles_agg.c.sgasoling == view_inv_cabecera_solicitud_ingreso.sgasoling)
            .outerjoin(clientes_agg, clientes_agg.c.clicodigo == view_inv_cabecera_solicitud_ingreso.clicodigo)
            .outerjoin(proveedor_agg, proveedor_agg.c.procodigo == view_inv_cabecera_solicitud_ingreso.procodigo)
            .filter(
                view_inv_cabecera_solicitud_ingreso.ciacodigo == ciacodigo,
                view_inv_cabecera_solicitud_ingreso.loccodigo == loccodigo,
            )
        )

        # Aplicar filtros adicionales
        if codSolicitud:
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.sgasoling.like(f"%{codSolicitud}%"))
        if codCliente:
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.clicodigo == codCliente)
        if codProveedor:
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.procodigo == codProveedor)
        if detalle:
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.sgadescri.like(f"%{detalle}%"))
        if motivo:
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.motdescripcion.like(f"%{motivo}%"))
        if estado:
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.sgastatus.in_(estado))
        if codArticulo:
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(detalles_agg.c.articulos.like(f"%{codArticulo}%"))

        # Filtros de fecha
        fechaInicial = data.get("fechaInicial")
        fechaFinal = data.get("fechaFinal")
        if fechaInicial:
            fechaInicial = datetime.strptime(fechaInicial.split("T")[0], "%Y-%m-%d")
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.sgafecsol >= fechaInicial)
        if fechaFinal:
            fechaFinal = datetime.strptime(fechaFinal.split("T")[0], "%Y-%m-%d")
            query_SolicitudIngresoBusqueda = query_SolicitudIngresoBusqueda.filter(view_inv_cabecera_solicitud_ingreso.sgafecllegada <= fechaFinal)

        query_SolicitudIngresoBusqueda = apply_grilla_filters(query_SolicitudIngresoBusqueda, filters)

        # Conteo total sin `ORDER BY` para evitar errores
        total = query_SolicitudIngresoBusqueda.with_entities(func.count(distinct(view_inv_cabecera_solicitud_ingreso.sgasoling))).scalar()

        # Aplicar orden y paginación
        results = query_SolicitudIngresoBusqueda.order_by(view_inv_cabecera_solicitud_ingreso.sgasoling.desc()).offset((page - 1) * per_page).limit(per_page).all()

        solicitudes = []
        for result in results:
            fecha_solicitud = result.sgafecsol.strftime("%d/%m/%Y") if result.sgafecsol else None
            fecha_llegada = result.sgafecllegada.strftime("%d/%m/%Y") if result.sgafecllegada else None
            hora_solicitud = result.sgahorsol.strftime("%H:%M") if result.sgahorsol else None
            hora_llegada = result.sgahorllegada.strftime("%H:%M") if result.sgahorllegada else None

            # Consultar detalles de cliente y proveedor
            query_DescriCliente = db.session.query(Cxcmcli.clinombre).filter(Cxcmcli.clicodigo == result.clicodigo, Cxcmcli.ciacodigo == ciacodigo).first()

            query_DescriProveedor = db.session.query(cxpmprov.pronombre).filter(cxpmprov.procodigo == result.procodigo, cxpmprov.ciacodigo == ciacodigo).first()

            solicitud = {
                "sgasoling": result.sgasoling,
                "sgafecsol": fecha_solicitud,
                "sgahorsol": hora_solicitud,
                "motdescripcion": result.motdescripcion,
                "sgafecllegada": fecha_llegada,
                "sgahorllegada": hora_llegada,
                "sgacomenllegada": result.sgacomenllegada,
                "sgadescri": result.sgadescri,
                "clinombre": query_DescriCliente.clinombre if query_DescriCliente else None,
                "pronombre": query_DescriProveedor.pronombre if query_DescriProveedor else None,
                "sgagenepor": result.sgagenepor,
                "sgastatus": result.sgastatus,
            }
            solicitudes.append(solicitud)

        # Crear el diccionario resultSol
        resultSol = {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
            "solicitudes": [dict(solicitudI._asdict()) for solicitudI in results],
        }

        # Retornar la respuesta en formato JSON
        return jsonify(resultSol), 200

    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": "Ocurrió un error al procesar la solicitud"}), 404
