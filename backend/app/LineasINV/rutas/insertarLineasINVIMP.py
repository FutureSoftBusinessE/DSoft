from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime
from app.LineasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.LineasINV.rutas.validarLineasINVIMP import validar_lineasinv


@bp.route("/insertarLineasINVIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarLineasINVIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    with db.session.bind.connect() as connection:
        with connection.begin():
            # 1. Obtener formato de la empresa
            res_cfg = connection.execute(text("SELECT ciaforlin FROM siaccia WHERE ciacodigo = :cia"), {"cia": sCodCia}).mappings().fetchone()
            formato = res_cfg["ciaforlin"] if res_cfg else "##-##-##"
            sep = "".join([c for c in formato if c not in "0123456789#X"])[0] if any(c not in "0123456789#X" for c in formato) else "-"
            segs_len = [len(s) for s in formato.split(sep)]
            total_len = sum(segs_len)

            # 2. CORRECCIÓN: Llamado ajustado a 3 argumentos
            rows, summary = validar_lineasinv(connection, rows_csv, sCodCia)
            if summary["invalid_rows"] > 0:
                return {"data": "Errores detectados", "rows": rows, "summary": summary, "inserted": 0}

            to_insert = []
            for fila in rows:
                raw_code = str(fila.get("lincodigo", "")).replace("-", "").replace(".", "").strip().upper()
                full_code = raw_code.ljust(total_len, "0")[:total_len]
                # Cálculo de Jerarquía Automática
                segments = []
                idx = 0
                for largo in segs_len:
                    # segments.append(full_code[idx : idx + largo])
                    segments.append(full_code[slice(idx, idx + largo)])
                    idx += largo

                linnivel = 1
                lincodigo1 = ""
                linlindes = None

                for i in range(len(segments) - 1, -1, -1):
                    if segments[i] != ("0" * segs_len[i]):
                        linnivel = i + 1
                        lincodigo1 = "".join(segments[: i + 1])
                        if i > 0:
                            p_segs = segments[:i]
                            for j in range(i, len(segments)):
                                p_segs.append("0" * segs_len[j])
                            linlindes = "".join(p_segs)
                        break

                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "lincodigo": full_code,
                        "lindescri": str(fila.get("lindescri")).strip().upper()[:40],
                        "linlindes": linlindes,
                        "linnivel": linnivel,
                        "lincodigo1": lincodigo1,
                        "lintipo": str(fila.get("lintipo", "T")).upper()[:1],
                        "linstatus": str(fila.get("linstatus", "A")).upper()[:1],
                        "coscodigo": None,
                        "numsecini": None,
                        "numseccont": None,
                        "linfecisys": fecha_pura,
                        "linhorisys": hora_pura,
                        "linusuisys": sUsuario[:10],
                        "linfecmsys": fecha_pura,
                        "linhormsys": hora_pura,
                        "linusumsys": sUsuario[:10],
                    }
                )

            insert_sql = text(
                """
                INSERT INTO inblin (ciacodigo, lincodigo, lindescri, linlindes, linnivel, lintipo, linstatus, lincodigo1, coscodigo, numsecini, numseccont, linfecisys, linhorisys, linusuisys, linfecmsys, linhormsys, linusumsys)
                VALUES (:ciacodigo, :lincodigo, :lindescri, :linlindes, :linnivel, :lintipo, :linstatus, :lincodigo1, :coscodigo, :numsecini, :numseccont, :linfecisys, :linhorisys, :linusuisys, :linfecmsys, :linhormsys, :linusumsys)
            """
            )
            connection.execute(insert_sql, to_insert)

    return {"data": "Importación masiva completada con éxito", "inserted": len(to_insert)}
