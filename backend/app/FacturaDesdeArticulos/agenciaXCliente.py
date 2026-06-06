from flask import jsonify, request, make_response
from app.FacturaDesdeArticulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.cxcmcli import Cxcmcli
from app.models.cxpmprov import cxpmprov
from app.models.cxctcliagencias import Cxctcliagencias as cxctcliagencias
from app.models.cxcbreg import Cxcbreg as cxcbreg
from app.models.fapzona import Fapzona as fapzona
from app.models.rhbprov import rhbprov
from app.models.hotbciu import Hotbciu as hotbciu
from sqlalchemy import func, or_
from enum import Enum


@bp.route("/getAgenciaXCliente", methods=["POST"])
@jwt_required()
def getAgenciaXCliente():
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        db.session = get_session(clicianonBD)

        data = request.get_json()
        cliente = data.get("cliente")

        query_ayudaAgenciaXCliente = (
            db.session.query(
                cxctcliagencias.agencodigo,
                cxctcliagencias.agendescri,
                cxctcliagencias.agendirec,
                cxctcliagencias.agentelef1,
                cxctcliagencias.agentelef2,
                cxctcliagencias.agenemail,
                cxctcliagencias.regcodigo,
                cxcbreg.regdescri,
                cxctcliagencias.zoncodigo,
                fapzona.zondescri,
                cxctcliagencias.procodigo,
                rhbprov.prodescri,
                cxctcliagencias.ciucodigo,
                hotbciu.ciudescri,
            )
            .join(cxcbreg, cxcbreg.regcodigo == cxctcliagencias.regcodigo)
            .join(fapzona, fapzona.zoncodigo == cxctcliagencias.zoncodigo)
            .join(rhbprov, rhbprov.procodigo == cxctcliagencias.procodigo)
            .join(hotbciu, hotbciu.ciucodigo == cxctcliagencias.ciucodigo)
            .filter((cxctcliagencias.clicodigo == cliente) & (cxctcliagencias.ciacodigo == ciacodigo))
            .order_by(cxctcliagencias.agencodigo)
            .distinct()
        )

        result_list = query_ayudaAgenciaXCliente.all()

        query_result = [
            {
                "value": item.agencodigo,
                "label": f"{item.agencodigo} - {item.agendescri} - {item.agendirec}",
            }
            for item in result_list
        ]

        return jsonify({"agencias": query_result})
    except Exception as e:
        # Manejo de errores y respuesta con mensaje adecuado
        error_message = {
            "error": "Ocurrió un error al procesar la solicitud.",
            "details": str(e),
        }
        return make_response(jsonify(error_message), 500)
