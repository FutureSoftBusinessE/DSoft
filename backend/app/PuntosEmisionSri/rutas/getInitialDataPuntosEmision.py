from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.PuntosEmisionSri import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getInitialDataPuntosEmision", methods=["POST"])
@jwt_required()
@api_endpoint
def getInitialDataPuntosEmision():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 1. Combo de Localidades (cgblocal)
        sql_loc = text("SELECT loccodigo, locdescri FROM cgblocal WHERE ciacodigo = :cia AND locstatus = 'A'")
        localidades = connection.execute(sql_loc, {"cia": sCodCia}).mappings().fetchall()

        # 2. Combo de Autorizaciones SRI Disponibles
        # Traemos la información y formateamos las fechas para armar la etiqueta solicitada
        sql_aut = text(
            """
            SELECT
                sripreauto,
                sriautnumero,
                CONVERT(varchar, sriautfecemi, 106) as fecemi,
                CONVERT(varchar, sriautfecven, 106) as fecven
            FROM siacsrinumero
            WHERE ciacodigo = :cia
            ORDER BY sriautfecemi DESC
        """
        )
        autorizaciones = connection.execute(sql_aut, {"cia": sCodCia}).mappings().fetchall()

    # Formateo de los datos para el frontend
    lista_localidades = [{"id": r["loccodigo"], "label": f"{r['loccodigo']} - {r['locdescri']}"} for r in localidades]

    lista_autorizaciones = []
    for r in autorizaciones:
        # Mapeo del tipo para la etiqueta
        tipo_str = "ELECTRÓNICA" if r["sripreauto"] == "E" else ("PREIMPRESA" if r["sripreauto"] == "P" else "AUTOIMPRESORES")

        # Etiqueta concatenada: Ej: 9999999999 ELECTRÓNICA VALIDA DESDE 27 Jul 2022 CADUCA EN 31 Dic 2100
        label_str = f"{int(r['sriautnumero'])} {tipo_str} VALIDA DESDE {r['fecemi']} CADUCA EN {r['fecven']}"
        # Llave compuesta artificial para el combo
        lista_autorizaciones.append({"id": f"{r['sripreauto']}_{int(r['sriautnumero'])}", "sripreauto": r["sripreauto"], "sriautnumero": int(r["sriautnumero"]), "label": label_str})

    return {"data": {"localidades": lista_localidades, "autorizaciones": lista_autorizaciones}}
