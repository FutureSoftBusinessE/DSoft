# fmt: off
from flask import jsonify, request
from app.solicitudDeIngreso import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxpmprov import cxpmprov
from sqlalchemy import func, or_
from datetime import datetime
from app.models.inbsgamotivos import inbsgamotivos


@bp.route("/getAllFiltros", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllFiltros():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        db.session = get_session(clicianonBD)

        query_AllFiltros = (
            db.session.query(
                inbsgamotivos.motdescripcion,
            )
            .filter(
                inbsgamotivos.ciacodigo == ciacodigo,
                inbsgamotivos.mottipo == "SOLING",
                inbsgamotivos.motstatus == "A"
            )
            .all()
        )

        motivos = []
        for motivo in query_AllFiltros:
            motivos.append({"value": motivo.motdescripcion, "label": motivo.motdescripcion})

        print(motivos)

        return jsonify({"data": motivos}), 200

    except Exception as e:
        print(e)
        return jsonify({"message": str(e)}), 500
