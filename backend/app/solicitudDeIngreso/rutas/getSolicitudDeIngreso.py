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


@bp.route("/getSolicitudDeIngreso", methods=["POST"])
@cross_origin()
@jwt_required()
def getSolicitudDeIngreso():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usrcodigo = claims["user"]
        loccodigo = claims["localidad"]["loccodigo"]

        db.session = get_session(clicianonBD)

        data = request.get_json()

        # Filtros de búsqueda
        codSolicitud = data.get("codSolicitud")

        # Base de la consulta
        query_SolicitudIngresoBusqueda = (
            db.session.query(
                view_inv_cabecera_solicitud_ingreso.sgasoling,
                view_inv_cabecera_solicitud_ingreso.motdescripcion,
                view_inv_cabecera_solicitud_ingreso.sgadescri,
                view_inv_cabecera_solicitud_ingreso.clicodigo,
                view_inv_cabecera_solicitud_ingreso.procodigo,
                view_inv_cabecera_solicitud_ingreso.sgafecllegada,
                view_inv_cabecera_solicitud_ingreso.sgahorllegada,
                view_inv_cabecera_solicitud_ingreso.sgacomenllegada,
                view_inv_cabecera_solicitud_ingreso.sgafecsol,
                view_inv_cabecera_solicitud_ingreso.sgahorsol,
            )
            .filter(
                view_inv_cabecera_solicitud_ingreso.ciacodigo == ciacodigo,
                view_inv_cabecera_solicitud_ingreso.loccodigo == loccodigo,
                view_inv_cabecera_solicitud_ingreso.sgasoling == codSolicitud,
            )
            .first()
        )

        query_SolicitudIngresoArticulos = (
            db.session.query(
                view_inv_detalle_solicitud_ingreso.artcodigo,
                view_inv_detalle_solicitud_ingreso.artdescri,
                view_inv_detalle_solicitud_ingreso.sgacansol,
                view_inv_detalle_solicitud_ingreso.sgacanrec,
                view_inv_detalle_solicitud_ingreso.sgastatus,
                view_inv_detalle_solicitud_ingreso.sgasecuen,
            )
            .filter(
                view_inv_detalle_solicitud_ingreso.ciacodigo == ciacodigo,
                view_inv_detalle_solicitud_ingreso.loccodigo == loccodigo,
                view_inv_detalle_solicitud_ingreso.sgasoling == codSolicitud,
            )
            .all()
        )

        # Consultar detalles de cliente y proveedor
        query_DescriCliente = db.session.query(Cxcmcli.clinombre).filter(Cxcmcli.clicodigo == query_SolicitudIngresoBusqueda[3], Cxcmcli.ciacodigo == ciacodigo).first()

        query_DescriProveedor = db.session.query(cxpmprov.pronombre).filter(cxpmprov.procodigo == query_SolicitudIngresoBusqueda[4], cxpmprov.ciacodigo == ciacodigo).first()

        proveedorNombre = query_DescriProveedor[0] if query_DescriProveedor else ""

        articulosDetalle = []

        for result in query_SolicitudIngresoArticulos:
            articulosDetalle.append(
                {
                    "artcodigo": result[0],
                    "descripcion": result[1],
                    "cantidadSolicitada": result[2],
                    "cantidadRecibida": result[3],
                    "estado": result[4],
                    "posicion": result[5],
                }
            )

        solicitud = {
            "solicitudCodigo": codSolicitud,
            "motivo": query_SolicitudIngresoBusqueda[1],
            "descripcion": query_SolicitudIngresoBusqueda[2],
            "cliente": query_DescriCliente[0],
            "proveedor": proveedorNombre,
            "fechaLlegada": query_SolicitudIngresoBusqueda[5],
            "horaLlegada": query_SolicitudIngresoBusqueda[6],
            "comentarioLlegada": query_SolicitudIngresoBusqueda[7],
            "articulos": articulosDetalle,
            "fechaEmision": query_SolicitudIngresoBusqueda[8],
            "horaEmision": query_SolicitudIngresoBusqueda[9],
            "usuarioEmision": usrcodigo,
        }
        # Retornar la respuesta en formato JSON
        return jsonify({"data": solicitud}), 200

    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": "Ocurrió un error al procesar la solicitud"}), 404
