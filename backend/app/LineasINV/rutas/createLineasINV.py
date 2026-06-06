from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.LineasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createLineasINV", methods=["POST"])
@jwt_required()
@api_endpoint
def createLineasINV():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()
    # Limpiar código de máscaras visuales
    lincodigo_raw = str(data.get("lincodigo", "")).replace("-", "").replace(".", "").strip().upper()
    lindescri = str(data.get("lindescri", "")).strip().upper()[:40]

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # 1. Obtener formato dinámico de siaccia
            res_cia = connection.execute(text("SELECT ciaforlin FROM siaccia WHERE ciacodigo = :cia"), {"cia": sCodCia}).mappings().fetchone()
            formato = res_cia["ciaforlin"] if res_cia else "##-##-##"
            # Identificar separador y longitudes de segmentos
            separador = "".join([c for c in formato if c not in "0123456789#X"])[0] if any(c not in "0123456789#X" for c in formato) else "-"
            segmentos_len = [len(s) for s in formato.split(separador)]
            total_len = sum(segmentos_len)
            # 2. Rellenar código con ceros a la derecha (Capa de Datos)
            lincodigo_full = lincodigo_raw.ljust(total_len, "0")[:total_len]

            # 3. Descomponer para calcular Jerarquía
            segments = []
            curr = 0
            for length in segmentos_len:
                segments.append(lincodigo_full[slice(curr, curr + length)])
                # segments.append(lincodigo_full[curr : curr + length])
                curr += length

            linnivel = 1
            lincodigo1 = ""
            linlindes = None

            for i in range(len(segments) - 1, -1, -1):
                if segments[i] != ("0" * segmentos_len[i]):
                    linnivel = i + 1
                    # lincodigo1: Código truncado al nivel actual (Ej: 0201)
                    lincodigo1 = "".join(segments[: i + 1])
                    # linlindes: Si no es nivel 1, el padre es el nivel anterior completo (Ej: 020000)
                    if i > 0:
                        parent_segs = segments[:i]
                        for j in range(i, len(segments)):
                            parent_segs.append("0" * segmentos_len[j])
                        linlindes = "".join(parent_segs)
                    break

            # 4. Inserción con tipos corregidos: M = Mayor, T = Transaccional
            data_insert = {
                "ciacodigo": sCodCia,
                "lincodigo": lincodigo_full,
                "lindescri": lindescri,
                # NULL para Nivel 1
                "linlindes": linlindes,
                "coscodigo": data.get("coscodigo"),
                "linnivel": linnivel,
                "lintipo": data.get("lintipo", "T").upper()[:1],
                "linstatus": data.get("linstatus", "A").upper()[:1],
                "numsecini": data.get("numsecini"),
                "numseccont": data.get("numseccont"),
                "lincodigo1": lincodigo1,
                "linfecisys": fecha_pura,
                "linhorisys": hora_pura,
                "linusuisys": sUsuario[:10],
                "linfecmsys": fecha_pura,
                "linhormsys": hora_pura,
                "linusumsys": sUsuario[:10],
            }

            query = text(
                """
                INSERT INTO inblin (ciacodigo, lincodigo, lindescri, linlindes, coscodigo, linnivel, lintipo, linstatus, numsecini, numseccont, lincodigo1, linfecisys, linhorisys, linusuisys, linfecmsys, linhormsys, linusumsys)
                VALUES (:ciacodigo, :lincodigo, :lindescri, :linlindes, :coscodigo, :linnivel, :lintipo, :linstatus, :numsecini, :numseccont, :lincodigo1, :linfecisys, :linhorisys, :linusuisys, :linfecmsys, :linhormsys, :linusumsys)
            """
            )
            connection.execute(query, data_insert)

    return {"data": "Grupo de Productos creado exitosamente"}
