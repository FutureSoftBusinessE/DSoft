from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.FirmarPDFDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from services.encrip_desencrip import encriptar


@bp.route("/getConfigFirmarPDF", methods=["GET"])
@jwt_required()
@api_endpoint
def getConfigFirmarPDF():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims.get("user")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    is_gerente_flag = False
    has_global_firma = False

    with engine.connect() as connection:
        # 1. Verificar si el usuario es Gerente
        is_gerente_query = """
        SELECT usrcodigo, usrflagger
        FROM siactloc
        WHERE usrcodigo = :usrcodigo
          AND ciacodigo = :ciacodigo
          AND loccodigo = :loccodigo
        """
        is_gerente_result = connection.execute(text(is_gerente_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "usrcodigo": encriptar(usrcodigo)}).mappings().fetchone()

        if is_gerente_result:
            is_gerente_result = dict(is_gerente_result)
            if is_gerente_result.get("usrflagger", 0) != 0:
                is_gerente_flag = True

        # 2. Verificar si existe Firma Global configurada
        sql_cgb = text("SELECT locpathxml FROM cgblocal WHERE ciacodigo = :cia AND loccodigo = :loc")
        cgb_res = connection.execute(sql_cgb, {"cia": ciacodigo, "loc": loccodigo}).fetchone()

        if cgb_res and cgb_res[0]:
            # Comprobar que el documento exista y esté activo
            sql_doc = text("SELECT documentouuid FROM gdocmdocumentos WHERE documentouuid = :uuid AND ciacodigo = :cia AND docestisys = 'A'")
            doc_res = connection.execute(sql_doc, {"uuid": cgb_res[0], "cia": ciacodigo}).fetchone()
            if doc_res:
                has_global_firma = True

    return {"is_gerente": is_gerente_flag, "has_global_firma": has_global_firma}
