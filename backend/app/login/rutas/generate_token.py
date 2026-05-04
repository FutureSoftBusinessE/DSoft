# flake8: noqa
import json
import platform
from flask import jsonify, request, current_app
from flask_cors import cross_origin
from flask_jwt_extended import create_access_token, get_jwt, jwt_required
from app.login import bp
from app.extensions import db
from app.extensions import jwt
from app.extensions import cors
from app.models.DynamicLoginDB import DynamicLoginDB, DynamicLoginDBSchema
from services.encrip_desencrip import encriptar, desencriptar
from datetime import timedelta
from app.db import get_session
from sqlalchemy import text


# {
#     "user": "fsoft",
#     "password": "f",
#     "seleccion":
#         {
#             "cliciaciacodigo": "01",
#             "cliciacianombre": "PRACTICASA",
#             "clicianonBD": "SiacPracticasa",
#             "cliciarutaBD": "fsoftapptest.futuresoft-ec.com,14666"
#         },
#     "localidad":
#         {
#             "loccodigo": "07",
#             "locdescri": "BODEGA SAMBO"
#         },
# }
@bp.route("/generate_token", methods=["POST"])
@cross_origin()
def generate_token():
    try:
        data = request.get_json() if request.is_json else None
        usuario = data.get("user")
        password = data.get("password")
        seleccion = data.get("seleccion")
        localidad = data.get("localidad")

        my_os = platform.system()
        if my_os == "Linux":
            usrcodigo = usuario
            usrclave = password

        else:
            usrcodigo = encriptar(usuario)
            usrclave = encriptar(password)

        result = DynamicLoginDB.query.filter_by(usrcodigo=usrcodigo).first()
        dynamic_login_schema = DynamicLoginDBSchema()

        tabla = result.__dict__
        tabla_dict = tabla
        # usrcodigo = tabla_dict['usrcodigo']

        if len(password) > 10:
            return jsonify({"status": "error", "message": "Su contraseña no debe tener mas de 10 caracteres"})

        if tabla_dict["usrcodigo"] == usrcodigo and tabla_dict["usrclave"] == usrclave:
            # Obtener franquicias si es que tiene
            db.session = get_session("SiacFSBS")
            engine = db.session.bind
            with engine.connect() as connection:
                with connection.begin():
                    franquicias_query = """
                        SELECT fsbsmclicia.cliciagrupo,
                        char(39) + fsbsmclicia.cliciaciacodigo + char(39) +
                            isNull((STUFF( (SELECT  char(39) +',' + char(39) + fsbsmcliciafranquicia.frcliciaciacodigo
                                    FROM fsbsmcliciafranquicia
                                    WHERE fsbsmcliciafranquicia.cliciaidenti = :cliciaidenti
                                    FOR XML PATH('')) +char(39), 1, 2, ',')),'') As CiaFranqui
                    FROM fsbsmclicia
                    """
                franquicias_result = connection.execute(text(franquicias_query), {"cliciaidenti": seleccion.get("cliciaidenti")}).mappings().fetchall()

            payload = {"user": usuario, "seleccion": seleccion, "localidad": localidad, "hasFranquicias": len(franquicias_result) > 0, "franquicias": [dict(fr) for fr in franquicias_result]}
            access_token = create_access_token(usuario, additional_claims=payload, expires_delta=timedelta(days=1))
            response = {
                "status": "ok",
                "message": "Iniciaste sesion",
                "data": payload,
                "token": access_token,
            }
            current_app.logger.info("[API_SUCCESS] | Endpoint: %s | Status: %s | Message: %s | Details: %s", "/login/generate_token", "SUCCESS", "Token JWT generado exitosamente", "Iniciaste sesion")
        else:
            response = {"status": "error", "message": "datos incorrectos"}
            current_app.logger.error("[API_ERROR] | Endpoint: %s | Status: %s | Message: %s | Details: %s", "/login/generate_token", "FAILED", "Token JWT no fue generado", "Datos incorrectos")
        return jsonify(response)
    except Exception as e:
        current_app.logger.error("[API_ERROR] | Endpoint: %s | Status: %s | Message: %s | Details: %s", "/login/generate_token", "FAILED", "Token JWT no fue generado", "datos incorrectos, error en la solicitud")
        response = {"status": "error", "message": "datos incorrectos, error en la solicitud"}
        return jsonify(response)


@bp.route("/test_token", methods=["POST"])
@cross_origin()
@jwt_required()
def test_token():
    claims = get_jwt()

    return jsonify(claims)


@bp.route("/refresh_token", methods=["POST"])
@cross_origin()
@jwt_required(refresh=True)
def refresh_token():
    claims = get_jwt()
    access_token = create_access_token(claims["identity"], additional_claims=claims)
    response = {"status": "ok", "message": "Token refreshed", "token": access_token}
    return jsonify(response)


# retoena el tiempo que le queda al token
@bp.route("/verify_token", methods=["POST"])
@cross_origin()
@jwt_required()
def verify_token():
    claims = get_jwt()
    response = {"status": "ok", "message": "Token verified", "left_time": claims["exp"] - claims["iat"], "data": claims}
    return jsonify(response)
