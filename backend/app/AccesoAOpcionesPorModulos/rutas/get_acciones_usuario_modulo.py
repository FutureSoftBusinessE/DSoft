from flask import jsonify, request
from app.AccesoAOpcionesPorModulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from services.encrip_desencrip import encriptar, desencriptar
from datetime import datetime


# Agrega este endpoint en tu archivo de rutas (app/AccesoAOpcionesPorModulos/__init__.py o similar)
@bp.route("/get_acciones_usuario_modulo", methods=["POST"])
@jwt_required()
def get_acciones_usuario_modulo():
    """
    Obtiene TODAS las acciones que ya tiene guardadas un usuario para un módulo
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()
    ciacodigo = data.get("ciacodigo")
    usrcodigo = data.get("usrcodigo")
    modcodigo = data.get("modcodigo")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # Verificar si existe la tabla
                table_check_query = """
                SELECT CASE WHEN EXISTS (
                    SELECT 1 FROM information_schema.tables WHERE table_name = 'siactusrwebbar'
                ) THEN 1 ELSE 0 END as table_exists
                """
                table_exists = connection.execute(text(table_check_query)).scalar() == 1

                if not table_exists:
                    return jsonify({"data": [], "status": "ok", "message": "Tabla de acciones no existe"}), 200

                # Obtener TODAS las acciones del usuario para este módulo
                query = """
                SELECT DISTINCT
                    uwb.opctag,
                    uwb.acccaption,
                    COALESCE(uwb.opccontroller, '') as opccontroller,
                    COALESCE(a.accnameicono, '') as accnameicono,
                    COALESCE(a.acctipoico, '') as acctipoico,
                    uwb.usrfecisys
                FROM siactusrwebbar uwb
                LEFT JOIN siacopcaccion a ON uwb.acccaption = a.acccaption
                WHERE uwb.usrcodigo = :usrcodigo
                    AND uwb.ciacodigo = :ciacodigo
                    AND uwb.modcodigo = :modcodigo
                ORDER BY uwb.opctag, uwb.acccaption
                """

                result = connection.execute(text(query), {"usrcodigo": encriptar(usrcodigo), "ciacodigo": ciacodigo, "modcodigo": modcodigo}).mappings().fetchall()

                acciones = []
                for row in result:
                    acciones.append({"opctag": row["opctag"], "acccaption": row["acccaption"], "opccontroller": row["opccontroller"], "accnameicono": row["accnameicono"], "acctipoico": row["acctipoico"], "fecha_asignacion": row["usrfecisys"].isoformat() if row["usrfecisys"] else None})

                print(f"Acciones guardadas encontradas: {len(acciones)}")
                return jsonify({"data": acciones, "status": "ok", "total": len(acciones)}), 200

    except Exception as e:
        print(f"Error obteniendo acciones del usuario: {str(e)}")
        return jsonify({"error": {"msg": f"Error obteniendo acciones: {str(e)}"}}), 400
