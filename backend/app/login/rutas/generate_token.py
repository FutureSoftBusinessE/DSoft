# flake8: noqa
import json
import platform
from flask import jsonify, request, current_app

from flask_jwt_extended import create_access_token, get_jwt, jwt_required, decode_token
from app.login import bp
from app.extensions import db
from app.extensions import jwt
from app.extensions import cors
from app.models.DynamicLoginDB import DynamicLoginDB, DynamicLoginDBSchema
from services.encrip_desencrip import encriptar, desencriptar
from datetime import timedelta, datetime
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError, APIError, DatabaseError, validate_required


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
@api_endpoint
def generate_token():
    data = request.get_json()
    if data is None:
        raise ValidationError("Se esperaba un cuerpo JSON válido")

    validate_required(
        data,
        {
            "user": str,
            "password": str,
            "seleccion": dict,
            "localidad": dict,
        },
    )

    usuario = data["user"]
    password = data["password"]
    seleccion = data["seleccion"]
    localidad = data["localidad"]
    clicianonBD = seleccion["clicianonBD"]

    if len(password) > 10:
        raise ValidationError(
            "Su contraseña no debe tener más de 10 caracteres",
            details={"field": "password", "max_length": 10},
        )

    if platform.system() == "Linux":
        usrcodigo, usrclave = usuario, password
    else:
        usrcodigo, usrclave = encriptar(usuario), encriptar(password)

    login_engine = get_session(clicianonBD).bind
    login_query = """
        SELECT usrcodigo, usrclave
        FROM siaccusr
        WHERE usrcodigo = :usrcodigo
    """
    with login_engine.connect() as connection:
        result = (
            connection.execute(
                text(login_query),
                {"usrcodigo": usrcodigo},
            )
            .mappings()
            .fetchone()
        )

    if result is None:
        raise APIError("No se pudo encontrar el usuario")

    if result["usrclave"] != usrclave:
        raise APIError("Contraseña incorrecta")

    # ---- Franquicias ----
    try:
        franquicias_engine = get_session("DSOFT").bind
        franquicias_query = """
            SELECT f2.cliciagrupo, f2.cliciaidenti,
                   f.frcliciacianombre, f.frcliciaciacodigo
            FROM fsbsmcliciafranquicia f
            JOIN fsbsmclicia f2 ON f2.cliciaidenti = f.cliciaidenti
            WHERE f.cliciaidenti = :cliciaidenti
        """
        with franquicias_engine.connect() as connection:
            franquicias_result = (
                connection.execute(
                    text(franquicias_query),
                    {"cliciaidenti": seleccion.get("cliciaidenti")},
                )
                .mappings()
                .fetchall()
            )
    except Exception as e:
        raise DatabaseError(
            "consulta de franquicias",
            details={"cliciaidenti": seleccion.get("cliciaidenti"), "error": str(e)},
        )

    payload = {
        "user": usuario,
        "seleccion": seleccion,
        "localidad": localidad,
        "hasFranquicias": len(franquicias_result) > 0,
        "franquicias": [dict(fr) for fr in franquicias_result],
    }

    access_token = create_access_token(
        identity=usuario,
        additional_claims=payload,
        expires_delta=timedelta(hours=11),
    )

    return {
        "status": "ok",
        "message": "Iniciaste sesión",
        "data": payload,
        "token": access_token,
    }


@bp.route("/test_token", methods=["POST"])
@jwt_required()
def test_token():
    claims = get_jwt()

    return jsonify(claims)


@bp.route("/refresh_token", methods=["POST"])
@jwt_required(refresh=True)
def refresh_token():
    claims = get_jwt()
    access_token = create_access_token(claims["identity"], additional_claims=claims)
    response = {"status": "ok", "message": "Token refreshed", "token": access_token}
    return jsonify(response)


# retoena el tiempo que le queda al token
@bp.route("/verify_token", methods=["POST"])
@jwt_required()
def verify_token():
    claims = get_jwt()
    response = {"status": "ok", "message": "Token verified", "left_time": claims["exp"] - claims["iat"], "data": claims}
    return jsonify(response)


# cambio de compañia sin necesidad de volver a iniciar sesion
@bp.route("/switch_company_token", methods=["POST"])
@jwt_required()  # <- ESTO ES CLAVE: Solo un usuario ya logueado puede ejecutar esto
def switch_company_token():
    try:
        data = request.get_json() if request.is_json else None
        usuario = data.get("user")
        seleccion = data.get("seleccion")
        localidad = data.get("localidad")

        # Seguridad extra: Verificar que quien pide el cambio es el dueño del token actual
        claims = get_jwt()
        if claims.get("sub") != usuario and claims.get("user") != usuario:
            return jsonify({"status": "error", "message": "Operación no autorizada"}), 403

        # Obtener franquicias (Misma lógica que generate_token)
        db.session = get_session("DSOFT")
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

        # Armar el nuevo payload con la NUEVA compañía y localidad
        payload = {"user": usuario, "seleccion": seleccion, "localidad": localidad, "hasFranquicias": len(franquicias_result) > 0, "franquicias": [dict(fr) for fr in franquicias_result]}

        # Generar el nuevo token SIN pedir contraseña
        access_token = create_access_token(usuario, additional_claims=payload, expires_delta=timedelta(days=1))

        # ============================================================
        # Registrar la nueva sesión activa en medauditoria de la
        # EMPRESA DESTINO
        # ============================================================
        jti_nuevo = decode_token(access_token)["jti"]

        clicianonBD_destino = seleccion.get("clicianonBD")
        db.session = get_session(clicianonBD_destino)
        engine_aud = db.session.bind

        with engine_aud.connect() as connection:
            with connection.begin():
                insert_sql = text(
                    """
                    INSERT INTO medauditoria
                        (usrcodigo, usrnombre, hostname, hostip, fecisys, modcodigo, jti, cliciaidenti)
                    VALUES
                        (:usrcodigo, :usrnombre, :hostname, :hostip, :fecisys, :modcodigo, :jti, :cliciaidenti)
                    """
                )
                connection.execute(
                    insert_sql,
                    {
                        "usrcodigo": usuario,
                        "usrnombre": usuario,
                        "hostname": request.headers.get("X-Forwarded-For", request.remote_addr),
                        "hostip": request.remote_addr,
                        "fecisys": datetime.now(),
                        "modcodigo": "WEB",
                        "jti": jti_nuevo,
                        "cliciaidenti": seleccion.get("cliciaidenti"),
                    },
                )

        return jsonify(
            {
                "status": "ok",
                "message": "Compañía cambiada exitosamente",
                "data": payload,
                "token": access_token,
            }
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})
