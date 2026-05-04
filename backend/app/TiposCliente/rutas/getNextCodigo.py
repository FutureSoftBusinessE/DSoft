from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.TiposCliente import bp
from app.db import get_session


@bp.route("/getNextCodigo", methods=["POST", "GET"])
@jwt_required()
def getNextCodigo():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        sCodCia = claims["seleccion"]["cliciaciacodigo"]

        db_session = get_session(clicianonBD)
        engine = db_session.bind

        with engine.connect() as connection:
            last_sql = text(
                """
                SELECT TOP 1 clicodigo
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                ORDER BY TRY_CAST(clicodigo AS INT) DESC
                """
            )
            last_row = connection.execute(last_sql, {"ciacodigo": sCodCia}).mappings().first()

            last_code_num = 0
            if last_row and last_row["clicodigo"]:
                last_code_num = int(last_row["clicodigo"])

            next_code = last_code_num + 1
            clicodigo = str(next_code).zfill(6)

        return jsonify({"success": True, "data": {"ciacodigo": sCodCia, "clicodigo": clicodigo}})
    except Exception as e:
        print(f"[getNextCodigo ERROR] {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
