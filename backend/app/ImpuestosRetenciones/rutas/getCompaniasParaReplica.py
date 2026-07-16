from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime
from app.ImpuestosRetenciones import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError, NotFoundError


@bp.route("/getCompaniasParaReplica", methods=["POST"])
@jwt_required()
@api_endpoint
def getCompaniasParaReplica():
    """
    Obtiene la lista de companias disponibles para replicar un impuesto/retencion.
    Devuelve los datos del impuesto origen y para cada compania destino indica
    si ya tiene ese impuesto y su porcentaje actual.
    Solo accesible para la compania 01 (DSoft).
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Solo la compania 01 (DSoft) puede replicar
    if sCodCia != "01":
        raise ValidationError("No autorizado. Solo DSoft puede replicar impuestos o retenciones.")

    data = request.get_json()
    impid_origen = data.get("impid_origen", "").strip()

    if not impid_origen:
        raise ValidationError("Debe especificar el impuesto origen.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Obtener el impuesto origen de la compania 01 (DSoft)
            query_origen = text(
                """
                SELECT
                    impid, impdescri, impporcent, impretimp, impesiva,
                    impaplica, impbienser, codSRI, desSRI, impstatus
                FROM cxpbimp
                WHERE ciacodigo = '01' AND impid = :impid
            """
            )
            result_origen = connection.execute(query_origen, {"impid": impid_origen}).mappings().fetchone()

            if not result_origen:
                raise NotFoundError("Impuesto origen no encontrado en DSoft.")

            impuesto_origen = dict(result_origen)

            # Obtener todas las companias activas excepto 01
            query_companias = text(
                """
                SELECT ciacodigo, ciadescri
                FROM siaccia
                WHERE ciastatus = 'A' AND ciacodigo != '01'
                ORDER BY ciacodigo
            """
            )
            companias = connection.execute(query_companias).mappings().fetchall()

            # Para cada compania, verificar si ya tiene este impuesto y obtener sus datos actuales
            companias_resultado = []
            for compania in companias:
                query_existe = text(
                    """
                    SELECT
                        impdescri,
                        impporcent,
                        impesiva,
                        impaplica,
                        impretimp,
                        impbienser,
                        codSRI,
                        desSRI,
                        impstatus
                    FROM cxpbimp
                    WHERE ciacodigo = :ciacodigo AND impid = :impid
                """
                )
                existe = connection.execute(query_existe, {"ciacodigo": compania["ciacodigo"], "impid": impid_origen}).mappings().fetchone()

                if existe:
                    companias_resultado.append(
                        {
                            "ciacodigo": compania["ciacodigo"],
                            "ciadescri": compania["ciadescri"],
                            "existe": True,
                            "porcentaje_actual": float(existe["impporcent"]),
                            "datos_actuales": {
                                "impdescri": existe["impdescri"],
                                "impporcent": float(existe["impporcent"]),
                                "impesiva": existe["impesiva"],
                                "impaplica": existe["impaplica"],
                                "impretimp": existe["impretimp"],
                                "impbienser": existe["impbienser"],
                                "codSRI": existe["codSRI"],
                                "desSRI": existe["desSRI"],
                                "impstatus": existe["impstatus"],
                            },
                        }
                    )
                else:
                    companias_resultado.append({"ciacodigo": compania["ciacodigo"], "ciadescri": compania["ciadescri"], "existe": False, "porcentaje_actual": None, "datos_actuales": None})

    return {"impuesto_origen": impuesto_origen, "companias": companias_resultado}
