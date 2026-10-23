from datetime import datetime

from flask import jsonify, request, g
from sqlalchemy import text

from app.db import get_session
from app.extensions import jwt
from app.extensions import db


def _error_response(code, message, status_code):
    """
    Construye una respuesta de error con el mismo formato que @api_endpoint.
    """
    request_id = getattr(g, "request_id", "unknown")
    return (
        jsonify(
            {
                "success": False,
                "error": {
                    "code": code,
                    "message": message,
                },
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "endpoint": request.endpoint,
                    "method": request.method,
                    "path": request.path,
                    "request_id": request_id,
                },
            }
        ),
        status_code,
    )


def register_jwt_handlers(app):

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """
        Single-session por usuario POR EMPRESA.
        Compara el jti del token contra el jti del último login
        registrado en medauditoria (por usrcodigo) de la empresa del token.
        """
        jti = jwt_payload.get("jti")
        usrcodigo = jwt_payload.get("sub")

        if not jti or not usrcodigo:
            return True

        try:
            # BD del cliente que viene dentro del propio token
            clicianonBD = jwt_payload["seleccion"]["clicianonBD"]

            db.session = get_session(clicianonBD)
            engine = db.session.bind

            with engine.connect() as connection:
                sql = text(
                    """
                    SELECT TOP 1 jti
                    FROM medauditoria
                    WHERE usrcodigo = :usrcodigo
                      AND jti IS NOT NULL
                    ORDER BY fecisys DESC
                    """
                )
                row = connection.execute(sql, {"usrcodigo": usrcodigo}).mappings().first()
                app.logger.info(f"[LOADER] usrcodigo={usrcodigo} jtiToken={jti} jtiBD={row['jti'] if row else None}")

            if row is None:
                return True

            return row["jti"] != jti

        except Exception as e:
            app.logger.error(f"Error en token_in_blocklist_loader: {e}", exc_info=True)
            return True

    # ----------------------------------------------------------------
    #  Respuestas con el MISMO formato de @api_endpoint
    # ----------------------------------------------------------------

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return _error_response(
            "SESSION_REPLACED",
            "Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo.",
            401,
        )

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return _error_response(
            "TOKEN_EXPIRED",
            "El token ha expirado. Vuelve a iniciar sesión.",
            401,
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return _error_response(
            "TOKEN_INVALID",
            "Token inválido.",
            401,
        )

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return _error_response(
            "TOKEN_REQUIRED",
            "Se requiere token de autenticación.",
            401,
        )
