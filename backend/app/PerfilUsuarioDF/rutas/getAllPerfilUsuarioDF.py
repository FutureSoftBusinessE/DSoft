from flask import request
from app.PerfilUsuarioDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
import base64


# Mantenemos OPTIONS para el preflight de CORS
@bp.route("/getAllPerfilUsuarioDF", methods=["POST", "OPTIONS"], strict_slashes=False)
@jwt_required()
def getAllPerfilUsuarioDF():
    if request.method == "OPTIONS":
        return {"success": True}, 200

    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        db.session = get_session(clicianonBD)

        data = {}
        with db.session.bind.connect() as connection:
            # 1. Obtener datos visuales y logos (Tabla: siaccia)
            query_cia = text(
                """
                SELECT cialogo, ciaselloagua, ciatipomenu, ciacolor, ciatipoletra, ciatamanioletra
                FROM siaccia
                WHERE ciacodigo = :ciacodigo
            """
            )
            res_cia = connection.execute(query_cia, {"ciacodigo": ciacodigo}).mappings().fetchone()

            # Mapeo Defensivo
            if res_cia:
                data["ciatipomenu"] = int(res_cia.get("ciatipomenu") or 0)
                data["ciacolor"] = res_cia.get("ciacolor", "") or ""
                data["ciatipoletra"] = res_cia.get("ciatipoletra", "") or ""
                data["ciatamanioletra"] = res_cia.get("ciatamanioletra", "") or ""

                # Manejo de Binarios
                logo = res_cia.get("cialogo")
                sello = res_cia.get("ciaselloagua")
                data["cialogo_base64"] = f"data:image/jpeg;base64,{base64.b64encode(logo).decode('utf-8')}" if logo else None
                data["ciaselloagua_base64"] = f"data:image/jpeg;base64,{base64.b64encode(sello).decode('utf-8')}" if sello else None

            # 2. Obtener parámetros de email y Firma Activa (Tabla: cgblocal)
            # AJUSTE: Agregamos locpathxml a la consulta
            query_loc = text(
                """
                SELECT emailsmtp, emailmascara, emailsalida, emailtema, emailmensaje, emailsubject, locpathxml
                FROM cgblocal
                WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo
            """
            )
            res_loc = connection.execute(query_loc, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchone()

            # Mapeo Defensivo
            if res_loc:
                data["emailsmtp"] = res_loc.get("emailsmtp", "") or ""
                data["emailmascara"] = res_loc.get("emailmascara", "") or ""
                data["emailsalida"] = res_loc.get("emailsalida", "") or ""
                data["emailtema"] = res_loc.get("emailtema", "") or ""
                data["emailmensaje"] = res_loc.get("emailmensaje", "") or ""
                data["emailsubject"] = res_loc.get("emailsubject", "") or ""
                data["locpathxml"] = res_loc.get("locpathxml", "") or ""

        # Retorno directo SIN jsonify, tal cual como en getAllSubTiposPPE.py
        return {"success": True, "data": data}, 200

    except Exception as e:
        # Esto imprimirá el error exacto en su consola negra de Python para no estar a ciegas
        import traceback

        traceback.print_exc()
        return {"errores": f"Error interno al obtener el perfil: {str(e)}"}, 500
