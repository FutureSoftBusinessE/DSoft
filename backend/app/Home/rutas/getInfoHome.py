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
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo = claims["user"]

    data = request.get_json()
    passwordWeb = data.get("password")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Añadimos los nuevos campos al diccionario inicial
    dataInfoHome = {
        "ciaselloagua": None, 
        "cialogo": None, 
        "lastLoginFecisys": None, 
        "usrnombre": None, 
        "totalLogins": None, 
        "isFirstLoginUser": False, 
        "passwordChangeNeeded": False, 
        "ciaalias": None,
        "ciatipomenu": 0,
        "ciacolor": "",
        "ciatipoletra": "",
        "ciatamanioletra": ""
    }

    with engine.connect() as connection:
        with connection.begin():
            siacia_query = """
            SELECT
                ciaselloagua,
                cialogo,
                ciaalias,
                ciatipomenu,
                ciacolor,
                ciatipoletra,
                ciatamanioletra
            FROM
                siaccia
            WHERE
                ciacodigo = :ciacodigo
            """
            medauditoria_query = """
            SELECT
                usrnombre,
                fecisys
            FROM
                medauditoria
            WHERE
                usrcodigo = :usrcodigo
                AND modcodigo = 'WEB'
            ORDER BY
                fecisys DESC
            """
            siaccia_result = connection.execute(text(siacia_query), {"ciacodigo": ciacodigo}).mappings().fetchone()
            medauditoria_result = connection.execute(text(medauditoria_query), {"usrcodigo": usrcodigo}).mappings().fetchone()

            if siaccia_result:
                siaccia_result = dict(siaccia_result)
                img = siaccia_result["ciaselloagua"]
                imgLogo = siaccia_result["cialogo"]
                dataInfoHome["ciaselloagua"] = [(base64.b64encode(img).decode("utf-8").replace("\n", ""))] if img else None
                dataInfoHome["cialogo"] = [(base64.b64encode(imgLogo).decode("utf-8").replace("\n", ""))] if imgLogo else None
                dataInfoHome["ciaalias"] = siaccia_result["ciaalias"]
                
                # Asignación de variables visuales (Si son nulas de base de datos, usamos fallback)
                dataInfoHome["ciatipomenu"] = siaccia_result.get("ciatipomenu") or 0
                dataInfoHome["ciacolor"] = siaccia_result.get("ciacolor") or ""
                dataInfoHome["ciatipoletra"] = siaccia_result.get("ciatipoletra") or ""
                dataInfoHome["ciatamanioletra"] = siaccia_result.get("ciatamanioletra") or ""

            if medauditoria_result:
                medauditoria_result = dict(medauditoria_result)
                dataInfoHome["lastLoginFecisys"] = medauditoria_result["fecisys"]
                dataInfoHome["usrnombre"] = medauditoria_result["usrnombre"]

            total_logins_query = """
                SELECT count(*) AS totalLogins
                from medauditoria
                WHERE usrcodigo = :usrcodigo
            """
            total_logins_result = connection.execute(text(total_logins_query), {"usrcodigo": usrcodigo}).mappings().fetchone()
            num_total_logins = dict(total_logins_result).get("totalLogins", 0) if total_logins_result else 0

            dataInfoHome["totalLogins"] = num_total_logins
            dataInfoHome["isFirstLoginUser"] = num_total_logins == 0

            query_siaccusr = """
            SELECT
                usrcodigo, usrnombre, usrfecmsys, usrhormsys,
                usrusumsys, usrfecactuclave, usrdiascaduclave
            FROM siaccusr
            WHERE usrcodigo = :usrcodigo
            """
            siaccusr_result = connection.execute(text(query_siaccusr), {"usrcodigo": encriptar(usrcodigo)}).mappings().fetchone()

            if siaccusr_result and siaccusr_result.get("usrcodigo") == encriptar(passwordWeb):
                dataInfoHome["passwordChangeNeeded"] = True

            if siaccusr_result and siaccusr_result.get("usrdiascaduclave", 0) > 0:
                hoy = datetime.now().date()
                dias_transcurridos = (hoy - siaccusr_result.get("usrfecmsys").date()).days
                if dias_transcurridos >= siaccusr_result.get("usrdiascaduclave"):
                    dataInfoHome["passwordChangeNeeded"] = True

    return jsonify({"data": dataInfoHome}), 200
