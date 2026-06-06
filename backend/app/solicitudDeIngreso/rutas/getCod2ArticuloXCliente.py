from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime
from app.db import get_session


@bp.route("/getCod2ArticuloXCliente", methods=["POST"])
@jwt_required()
def getCod2ArticuloXCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    clicodigo = request.json.get("cliente")
    print(clicodigo)

    if not clicodigo:
        return jsonify({"error": "Código de cliente no proporcionado."}), 400

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as session:

            # Primer consulta: Detalles del Egreso
            consultaProveedor = text(
                """
                    select * from inbsgaclipro where ciacodigo = :ciacodigo
                    and clicodigo = :clicodigo and extcodigo = :clicodigo
                """
            )
            result = session.execute(consultaProveedor, {"ciacodigo": ciacodigo, "clicodigo": clicodigo}).mappings().all()

            if not result:
                return jsonify({"data": []}), 200  # No hay resultados
            proveedor = result[0]["procodigo"]

            sSql = text(
                """
                SELECT BodCli.bodcodigo, b.bodcodigo, a.artcodigo, a.artcodigo2, *
                FROM view_inmart a
                INNER JOIN inmstock b
                    ON a.ciacodigo = b.ciacodigo
                    AND a.invcodigo = b.invcodigo
                    AND a.artcodigo = b.artcodigo
                INNER JOIN (
                    SELECT ciacodigo, invcodigo, bodcodigo, clicodigo
                    FROM inbsgaclibod c
                    WHERE c.ciacodigo = :ciacodigo
                    AND c.clicodigo = :clicodigo
                ) BodCli
                    ON BodCli.ciacodigo = b.ciacodigo
                    AND BodCli.invcodigo = b.invcodigo
                    AND BodCli.bodcodigo = b.bodcodigo
                INNER JOIN inbsgaclipro d
                    ON d.ciacodigo = BodCli.ciacodigo
                    AND d.clicodigo = BodCli.clicodigo
                    AND d.extcodigo = BodCli.clicodigo
                INNER JOIN intartcodpro e
                    ON e.ciacodigo = d.ciacodigo
                    AND e.invcodigo = a.invcodigo
                    AND e.artcodigo = a.artcodigo
                    AND e.procodigo = d.procodigo
                WHERE a.ciacodigo = :ciacodigo
                """
            )

            resultArticulos = session.execute(sSql, {"ciacodigo": ciacodigo, "clicodigo": clicodigo, "procodigo": proveedor}).mappings().all()
            if len(resultArticulos) == 0:
                return jsonify({"data": []}), 200

            articulos = []
            for row in resultArticulos:
                articulo = {
                    "artcodigo": row["artcodigo"],
                    "artcodigo2": row["artcodigo2"],
                    "artdescri": row["artdescri"],
                }
                articulos.append(articulo)
            # Mapea los datos a una respuesta
            data = articulos

            return jsonify({"data": data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
