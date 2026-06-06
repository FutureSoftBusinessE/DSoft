from flask import jsonify, request
from app.FacturaDesdeArticulosDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import bindparam, text
from app.db import get_session
from services.encrip_desencrip import encriptar
from app.models.DynamicLoginDB import DynamicLoginDB
from datetime import datetime
import base64


@bp.route("/getInfoCliente", methods=["POST"])
@jwt_required()
def getInfoCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    db.session = get_session(clicianonBD)
    engine = db.session.bind
    data = request.get_json()

    clicodigo = data["cliente"]

    try:
        with engine.connect() as session:

            sQl = """
                Select DISTINCT clidirec, cliruc, clitelef1, clidiascrs, climontocrs,
                cliprefac, cliemail, tipdescri, zondescri, regdescri,
                ciudescri, prodescri, cliestciv, actividescri, sectordescri,
                clidiapago, clidiasrecibefac1, cliapliiva, clibloqueo
                from cxcmcli
                inner join cxcbtipcli on cxcmcli.tipcodigo = cxcbtipcli.tipcodigo
                inner join fapzona on cxcmcli.zoncodigo = fapzona.zoncodigo
                inner join cxcbreg on cxcmcli.regcodigo = cxcbreg.regcodigo
                inner join hotbciu on cxcmcli.ciucodigo = hotbciu.ciucodigo
                inner join rhbprov on cxcmcli.procodigo = rhbprov.procodigo
                inner join cxcbacteconomicas on cxcmcli.activicodigo = cxcbacteconomicas.activicodigo
                inner join cxcbsectorpublico on cxcbsectorpublico.sectorcodigo = cxcmcli.sectorcodigo
                where cxcmcli.ciacodigo = :ciacodigo
                and clicodigo = :cliente
            """

            params = {"ciacodigo": ciacodigo, "cliente": clicodigo}

            result = session.execute(text(sQl), params).mappings().all()

            data = dict(result[0]) if result else {}

            response = {"data": data}
            return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
