from flask import jsonify, request
from app.Home import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from services.encrip_desencrip import encriptar, desencriptar
import base64
from sqlalchemy import text
from datetime import datetime


@bp.route("/getInfoHome", methods=["POST"])
@cross_origin()
@jwt_required()
def getInfoHome():
    # 1. Extracción de identidad y contexto del JWT
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo = claims["user"]

    # 2. Captura de datos del request
    data = request.get_json() or {}
    passwordWeb = data.get("password")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # 3. Estructura inicial de respuesta para el Home
    dataInfoHome = {"ciaselloagua": None, "cialogo": None, "lastLoginFecisys": None, "usrnombre": None, "totalLogins": 0, "isFirstLoginUser": False, "passwordChangeNeeded": False, "ciaalias": None, "ciatipomenu": 0, "ciacolor": "", "ciatipoletra": "", "ciatamanioletra": ""}

    with engine.connect() as connection:
        with connection.begin():
            # Consulta de configuración visual de la compañía
            siacia_query = """
            SELECT
                ciaselloagua, cialogo, ciaalias,
                ciatipomenu, ciacolor, ciatipoletra, ciatamanioletra
            FROM siaccia
            WHERE ciacodigo = :ciacodigo
            """
            # Consulta del último acceso del usuario
            medauditoria_query = """
            SELECT TOP 1
                usrnombre, fecisys
            FROM medauditoria
            WHERE usrcodigo = :usrcodigo
                AND modcodigo = 'WEB'
            ORDER BY fecisys DESC
            """
            siaccia_result = connection.execute(text(siacia_query), {"ciacodigo": ciacodigo}).mappings().fetchone()
            medauditoria_result = connection.execute(text(medauditoria_query), {"usrcodigo": usrcodigo}).mappings().fetchone()

            if siaccia_result:
                siaccia_result = dict(siaccia_result)
                img = siaccia_result.get("ciaselloagua")
                imgLogo = siaccia_result.get("cialogo")
                # Conversión de binarios a Base64 para visualización en React
                dataInfoHome["ciaselloagua"] = base64.b64encode(img).decode("utf-8") if img else None
                dataInfoHome["cialogo"] = base64.b64encode(imgLogo).decode("utf-8") if imgLogo else None
                dataInfoHome["ciaalias"] = siaccia_result.get("ciaalias")
                # Parámetros de Theming
                dataInfoHome["ciatipomenu"] = siaccia_result.get("ciatipomenu") or 0
                dataInfoHome["ciacolor"] = siaccia_result.get("ciacolor") or ""
                dataInfoHome["ciatipoletra"] = siaccia_result.get("ciatipoletra") or ""
                dataInfoHome["ciatamanioletra"] = siaccia_result.get("ciatamanioletra") or ""

            if medauditoria_result:
                medauditoria_result = dict(medauditoria_result)
                dataInfoHome["lastLoginFecisys"] = medauditoria_result["fecisys"]
                dataInfoHome["usrnombre"] = medauditoria_result["usrnombre"]

            # Conteo de logueos para determinar si es usuario nuevo
            total_logins_query = "SELECT count(*) AS totalLogins FROM medauditoria WHERE usrcodigo = :usrcodigo"
            total_logins_result = connection.execute(text(total_logins_query), {"usrcodigo": usrcodigo}).mappings().fetchone()
            num_total_logins = total_logins_result["totalLogins"] if total_logins_result else 0

            dataInfoHome["totalLogins"] = num_total_logins
            # 1 porque el login actual ya generó auditoría
            dataInfoHome["isFirstLoginUser"] = num_total_logins <= 1

            # 4. Lógica de seguridad y caducidad de clave
            query_siaccusr = """
            SELECT
                usrcodigo, usrfecmsys, usrdiascaduclave
            FROM siaccusr
            WHERE usrcodigo = :usrcodigo_encriptado
            """
            # Se asume que el usrcodigo en siaccusr está encriptado según el estándar del sistema
            siaccusr_result = connection.execute(text(query_siaccusr), {"usrcodigo_encriptado": encriptar(usrcodigo)}).mappings().fetchone()

            if siaccusr_result:
                # CORRECCIÓN: Solo validamos passwordWeb si no es nulo para evitar el TypeError de concatenación
                if passwordWeb is not None:
                    if siaccusr_result.get("usrcodigo") == encriptar(passwordWeb):
                        dataInfoHome["passwordChangeNeeded"] = True

                # Verificación de caducidad por días transcurridos
                dias_caducidad = siaccusr_result.get("usrdiascaduclave", 0)
                if dias_caducidad > 0:
                    fecha_cambio = siaccusr_result.get("usrfecmsys")
                    if fecha_cambio:
                        hoy = datetime.now()
                        dias_transcurridos = (hoy - fecha_cambio).days
                        if dias_transcurridos >= dias_caducidad:
                            dataInfoHome["passwordChangeNeeded"] = True

    return jsonify({"data": dataInfoHome}), 200
