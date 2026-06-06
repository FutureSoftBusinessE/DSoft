from flask import jsonify, request
from app.menu import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime, date
import calendar
from services.encrip_desencrip import encriptar

# Obtiene todos los menús (opccontrollers) asignados al usuario (solo los que existen en siactusrweb) y, para cada uno, devuelve un diccionario con información del menú y un arreglo "barraAcciones" que contiene las acciones permitidas; si no hay acciones, el arreglo queda vacío.


@bp.route("/get_menu_opciones_acciones", methods=["GET"])
@jwt_required()
def get_menu_opciones_acciones():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo = claims["user"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Verificar existencia de las tablas necesarias para acciones
            table_check_query = """
            SELECT
                CASE WHEN EXISTS (
                    SELECT 1 FROM information_schema.tables WHERE table_name = 'siacopcbarra'
                ) THEN 1 ELSE 0 END as has_siacopcbarra,
                CASE WHEN EXISTS (
                    SELECT 1 FROM information_schema.tables WHERE table_name = 'siacopcaccion'
                ) THEN 1 ELSE 0 END as has_siacopcaccion,
                CASE WHEN EXISTS (
                    SELECT 1 FROM information_schema.tables WHERE table_name = 'siactusrwebbar'
                ) THEN 1 ELSE 0 END as has_siactusrwebbar
            """

            table_check = connection.execute(text(table_check_query)).fetchone()

            has_siacopcbarra = table_check.has_siacopcbarra == 1
            has_siacopcaccion = table_check.has_siacopcaccion == 1
            has_siactusrwebbar = table_check.has_siactusrwebbar == 1

            # Si no existen las tablas de definición de acciones, devolver array vacío en barraAcciones
            if not (has_siacopcbarra and has_siacopcaccion):
                basic_query = """
                SELECT DISTINCT
                    siacopc.opccontroller,
                    siacopc.opctag
                FROM siactusrweb
                INNER JOIN siacopc
                    ON siactusrweb.opctag = siacopc.opctag
                    AND siactusrweb.modcodigo = siacopc.modcodigo
                    AND siacopc.opccontroller IS NOT NULL
                WHERE siactusrweb.usrcodigo = :usrcodigo
                    AND siactusrweb.ciacodigo = :ciacodigo
                    AND siactusrweb.modcodigo = 'WEB'
                """

                result = connection.execute(text(basic_query), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo)}).mappings().fetchall()

                permisos = {}
                for row in result:
                    controller = row["opccontroller"]
                    permisos[controller] = {"opctag": row["opctag"], "opccontroller": controller, "barraAcciones": []}

                return jsonify({"data": permisos, "status": "ok", "nota": "Sin permisos de barra"}), 200

            # Si EXISTEN siacopcbarra y siacopcaccion, ejecutar el query
            # Construir el query dinámicamente dependiendo de si existe siactusrwebbar
            # Y verificar si el usuario tiene permisos específicos

            # PRIMERO verificar si el usuario tiene registros en siactusrwebbar
            usuario_tiene_permisos_especificos = False
            if has_siactusrwebbar:
                check_permisos_query = """
                SELECT COUNT(*) as total
                FROM siactusrwebbar
                WHERE usrcodigo = :usrcodigo
                    AND ciacodigo = :ciacodigo
                    AND modcodigo = 'WEB'
                """

                count_result = connection.execute(text(check_permisos_query), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo)}).fetchone()

                usuario_tiene_permisos_especificos = count_result.total > 0

            # Ahora construir el query basado en la situación
            if has_siactusrwebbar and usuario_tiene_permisos_especificos:
                # Caso 1: Tabla EXISTE y usuario TIENE permisos específicos
                # Usar COALESCE para combinar permisos específicos con acciones por defecto
                query = """
                SELECT
                    siacopc.opccontroller,
                    siacopc.opctag,
                    COALESCE(siacopcaccion.acccaption, all_acciones.acccaption) AS acccaption,
                    COALESCE(siacopcaccion.accnameicono, all_acciones.accnameicono) AS accnameicono,
                    COALESCE(siacopcaccion.acctipoico, all_acciones.acctipoico) AS acctipoico
                FROM siactusrweb
                INNER JOIN siacopc
                    ON siactusrweb.opctag = siacopc.opctag
                    AND siactusrweb.modcodigo = siacopc.modcodigo
                    AND siacopc.opccontroller IS NOT NULL
                LEFT JOIN siactusrwebbar
                    ON siactusrweb.usrcodigo = siactusrwebbar.usrcodigo
                    AND siactusrweb.ciacodigo = siactusrwebbar.ciacodigo
                    AND siactusrweb.modcodigo = siactusrwebbar.modcodigo
                    AND siactusrweb.opctag = siactusrwebbar.opctag
                LEFT JOIN siacopcbarra
                    ON siactusrwebbar.modcodigo = siacopcbarra.modcodigo
                    AND siactusrwebbar.opctag = siacopcbarra.opctag
                    AND siactusrwebbar.acccaption = siacopcbarra.acccaption
                LEFT JOIN siacopcaccion
                    ON siacopcbarra.acccaption = siacopcaccion.acccaption
                -- Subquery con todas las acciones posibles del controller
                LEFT JOIN (
                    SELECT b.opctag, b.acccaption, a.accnameicono, a.acctipoico
                    FROM siacopcbarra b
                    INNER JOIN siacopcaccion a ON b.acccaption = a.acccaption
                ) AS all_acciones
                    ON all_acciones.opctag = siacopc.opctag
                WHERE siactusrweb.usrcodigo = :usrcodigo
                    AND siactusrweb.ciacodigo = :ciacodigo
                    AND siactusrweb.modcodigo = 'WEB'
                """
            else:
                # Caso 2: Tabla NO existe O usuario NO tiene permisos específicos
                # Usuario tiene acceso a TODAS las acciones por defecto
                query = """
                SELECT
                    siacopc.opccontroller,
                    siacopc.opctag,
                    all_acciones.acccaption AS acccaption,
                    all_acciones.accnameicono AS accnameicono,
                    all_acciones.acctipoico AS acctipoico
                FROM siactusrweb
                INNER JOIN siacopc
                    ON siactusrweb.opctag = siacopc.opctag
                    AND siactusrweb.modcodigo = siacopc.modcodigo
                    AND siacopc.opccontroller IS NOT NULL
                -- Subquery con todas las acciones posibles del controller
                LEFT JOIN (
                    SELECT b.opctag, b.acccaption, a.accnameicono, a.acctipoico
                    FROM siacopcbarra b
                    INNER JOIN siacopcaccion a ON b.acccaption = a.acccaption
                ) AS all_acciones
                    ON all_acciones.opctag = siacopc.opctag
                WHERE siactusrweb.usrcodigo = :usrcodigo
                    AND siactusrweb.ciacodigo = :ciacodigo
                    AND siactusrweb.modcodigo = 'WEB'
                """

            result = connection.execute(text(query), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo)}).mappings().fetchall()

            permisos = {}

            if not result:
                return jsonify({"data": {}, "status": "ok"}), 200

            for row in result:
                controller = row["opccontroller"]
                if controller not in permisos:
                    permisos[controller] = {"opctag": row["opctag"], "opccontroller": controller, "barraAcciones": []}

                # Solo agregar acción si existe
                if row["acccaption"] is not None and row["acccaption"] not in [a["acccaption"] for a in permisos[controller]["barraAcciones"]]:
                    permisos[controller]["barraAcciones"].append({"acccaption": row["acccaption"], "accnameicono": row["accnameicono"], "acctipoico": row["acctipoico"]})

            # Agregar nota informativa
            response_data = {"data": permisos, "status": "ok"}

            if has_siactusrwebbar:
                if usuario_tiene_permisos_especificos:
                    response_data["nota"] = "Con permisos específicos por usuario"
                else:
                    response_data["nota"] = "Acceso completo a todas las acciones (sin permisos específicos)"

            return jsonify(response_data), 200
