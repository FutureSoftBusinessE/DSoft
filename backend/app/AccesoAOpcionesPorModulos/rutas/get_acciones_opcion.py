from flask import jsonify, request
from app.AccesoAOpcionesPorModulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from services.encrip_desencrip import encriptar, desencriptar
from datetime import datetime


# En app/menu/bp.py - Agregar este endpoint
@bp.route("/get_acciones_opcion", methods=["POST"])
@jwt_required()
def get_acciones_opcion():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()
    ciacodigo = data.get("ciacodigo")
    usrcodigo = data.get("usrcodigo")
    opctag = data.get("opctag")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Verificar si las tablas existen
            table_check = """
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

            table_result = connection.execute(text(table_check)).fetchone()

            has_siacopcbarra = table_result.has_siacopcbarra == 1
            has_siacopcaccion = table_result.has_siacopcaccion == 1
            has_siactusrwebbar = table_result.has_siactusrwebbar == 1

            # Si no existen las tablas de acciones, devolver vacío
            if not has_siacopcbarra or not has_siacopcaccion:
                return jsonify({"data": [], "status": "ok", "nota": "No hay sistema de acciones configurado"}), 200

            # Obtener acciones disponibles para esta opción
            acciones_query = """
            SELECT DISTINCT
                b.acccaption,
                COALESCE(a.accnameicono, '') as accnameicono,
                COALESCE(a.acctipoico, '') as acctipoico,
                siacopc.opccontroller,
                CASE
                    WHEN uwb.acccaption IS NOT NULL THEN 1
                    ELSE 0
                END as permiso_actual
            FROM siacopcbarra b
            INNER JOIN siacopcaccion a ON b.acccaption = a.acccaption
            LEFT JOIN siactusrwebbar uwb ON
                uwb.opctag = b.opctag
                AND uwb.acccaption = b.acccaption
                AND uwb.usrcodigo = :usrcodigo
                AND uwb.ciacodigo = :ciacodigo
                AND uwb.modcodigo = 'WEB'
            LEFT JOIN siacopc ON
            siacopc.modcodigo = b.modcodigo
            AND siacopc.opctag = b.opctag
            WHERE b.opctag = :opctag
                AND b.modcodigo = 'WEB'
            ORDER BY b.acccaption
            """

            result = connection.execute(text(acciones_query), {"usrcodigo": encriptar(usrcodigo), "ciacodigo": ciacodigo, "opctag": opctag}).mappings().fetchall()

            acciones = []
            for row in result:
                acciones.append({"acccaption": row["acccaption"], "accnameicono": row["accnameicono"], "acctipoico": row["acctipoico"], "permiso": row["permiso_actual"] == 1, "opccontroller": row["opccontroller"]})

            return jsonify({"data": acciones, "status": "ok", "metadata": {"total_acciones": len(acciones), "tablas_disponibles": {"siacopcbarra": has_siacopcbarra, "siacopcaccion": has_siacopcaccion, "siactusrwebbar": has_siactusrwebbar}}}), 200
