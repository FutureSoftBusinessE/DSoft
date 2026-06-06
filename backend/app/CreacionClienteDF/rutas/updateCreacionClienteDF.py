from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.CreacionClienteDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateCreacionClienteDF", methods=["POST"])
@jwt_required()
@api_endpoint
def updateCreacionClienteDF():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    data = request.get_json()
    clicodigo_old = data.get("clicodigoOld")
    cliruc = str(data.get("cliruc", "")).strip()
    clinombre = str(data.get("clinombre", "")).strip().upper()

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # 1. Validación de Duplicados (Excluyendo al cliente actual)
            check_ruc_sql = text(
                """
                SELECT clinombre FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                  AND cliruc = :cliruc
                  AND clicodigo <> :clicodigo
            """
            )
            cliente_existente = connection.execute(check_ruc_sql, {"ciacodigo": sCodCia, "cliruc": cliruc, "clicodigo": clicodigo_old}).mappings().fetchone()
            if cliente_existente:
                raise ValidationError(f"Advertencia: El número de identificación '{cliruc}' ya está registrado bajo el nombre: {cliente_existente['clinombre']}")

            # 2. Actualización
            now = datetime.now()
            update_data = {
                "ciacodigo": sCodCia,
                "clicodigoOld": clicodigo_old,
                "clinombre": clinombre,
                "cliruc": cliruc,
                "clidirec": str(data.get("clidirec", "")).upper()[:200],
                "cliidentifica": str(data.get("cliidentifica")).upper()[:1],
                "cliemail": str(data.get("cliemail")).lower() if data.get("cliemail") else None,
                "clitelef1": data.get("clitelef1")[:15] if data.get("clitelef1") else None,
                "cliintersec": data.get("cliintersec")[:60] if data.get("cliintersec") else None,
                "clistatus": data.get("clistatus", "A"),
                "clifecmsys": now.strftime("%Y-%m-%d 00:00:00"),
                "clihormsys": now.strftime("1900-01-01 %H:%M:%S"),
                "cliusumsys": sUsuario[:10],
                "cliestmsys": sNomEst[:40],
            }

            connection.execute(
                text(
                    """
                UPDATE cxcmcli SET
                    clinombre = :clinombre, cliruc = :cliruc, clidirec = :clidirec,
                    cliidentifica = :cliidentifica, cliemail = :cliemail, clitelef1 = :clitelef1,
                    cliintersec = :cliintersec, clistatus = :clistatus,
                    clifecmsys = :clifecmsys, clihormsys = :clihormsys, cliusumsys = :cliusumsys, cliestmsys = :cliestmsys
                WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigoOld
            """
                ),
                update_data,
            )

    return {"data": "Cliente actualizado exitosamente"}
