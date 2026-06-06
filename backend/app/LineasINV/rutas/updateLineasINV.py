from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime
from app.LineasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateLineasINV", methods=["POST"])
@jwt_required()
@api_endpoint
def updateLineasINV():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()
    lincodigo_old = str(data.get("lincodigoOld")).strip().upper()
    lincodigo_new_raw = str(data.get("lincodigoNew")).replace("-", "").replace(".", "").strip().upper()

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            res_cia = connection.execute(text("SELECT ciaforlin FROM siaccia WHERE ciacodigo = :cia"), {"cia": sCodCia}).mappings().fetchone()
            formato = res_cia["ciaforlin"] if res_cia else "##-##-##"
            separador = "".join([c for c in formato if c not in "0123456789#X"])[0] if any(c not in "0123456789#X" for c in formato) else "-"
            segmentos_len = [len(s) for s in formato.split(separador)]
            total_len = sum(segmentos_len)
            lincodigo_new_full = lincodigo_new_raw.ljust(total_len, "0")[:total_len]

            segments = []
            curr = 0
            for largo in segmentos_len:
                # segments.append(lincodigo_new_full[curr : curr + largo])
                segments.append(lincodigo_new_full[slice(curr, curr + largo)])
                curr += largo
            linnivel = 1
            lincodigo1 = ""
            linlindes = None
            for i in range(len(segments) - 1, -1, -1):
                if segments[i] != ("0" * segmentos_len[i]):
                    linnivel = i + 1
                    lincodigo1 = "".join(segments[: i + 1])
                    if i > 0:
                        p_segs = segments[:i]
                        for j in range(i, len(segments)):
                            p_segs.append("0" * segmentos_len[j])
                        linlindes = "".join(p_segs)
                    break

            data_update = {
                "cia": sCodCia,
                "old": lincodigo_old,
                "new": lincodigo_new_full,
                "desc": str(data.get("lindescri")).strip().upper()[:40],
                "padre": linlindes,
                "nivel": linnivel,
                "l1": lincodigo1,
                "tipo": str(data.get("lintipo", "T")).upper()[:1],
                "status": str(data.get("linstatus", "A")).upper()[:1],
                "f": fecha_pura,
                "h": hora_pura,
                "u": sUsuario[:10],
            }

            query = text(
                """
                UPDATE inblin SET
                    lincodigo = :new, lindescri = :desc, linlindes = :padre,
                    linnivel = :nivel, lintipo = :tipo, linstatus = :status,
                    lincodigo1 = :l1, linfecmsys = :f, linhormsys = :h, linusumsys = :u
                WHERE ciacodigo = :cia AND lincodigo = :old
            """
            )
            connection.execute(query, data_update)

    return {"data": "Grupo actualizado exitosamente"}
