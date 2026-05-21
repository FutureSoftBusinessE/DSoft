from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.CreacionClienteDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createCreacionClienteDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createCreacionClienteDF():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    data = request.get_json()
    cliruc = str(data.get("cliruc", "")).strip()
    clinombre = str(data.get("clinombre", "")).strip().upper()

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # 1. Validación de Duplicados
            check_ruc_sql = text("""
                SELECT clinombre FROM cxcmcli
                WHERE ciacodigo = :ciacodigo AND cliruc = :cliruc
            """)
            cliente_existente = connection.execute(check_ruc_sql, {"ciacodigo": sCodCia, "cliruc": cliruc}).mappings().fetchone()
            if cliente_existente:
                # El mensaje se envía sin el prefijo 'APIError' para que el modal lo muestre limpio
                raise ValidationError(f"Advertencia: El número de identificación '{cliruc}' ya está registrado bajo el nombre: {cliente_existente['clinombre']}")

            # 2. Lógica de Localidad y Secuencia (siacsec)
            sql_sec = text("SELECT secnumero FROM siacsec WHERE ciacodigo = :ciacodigo AND seccodigo = 'CLI'")
            res_sec = connection.execute(sql_sec, {"ciacodigo": sCodCia}).mappings().fetchone()
            if not res_sec:
                raise ValidationError("Secuencia 'CLI' no configurada")
            nuevo_secnumero = int(res_sec["secnumero"]) + 1
            clicodigo = str(nuevo_secnumero).zfill(6)

            sql_local = text("SELECT activicodigo, regcodigo, sectorcodigo, tipcodigo, zoncodigo, procodigo, ciucodigo, parrocodigo FROM cgblocal WHERE ciacodigo = :ciacodigo AND loccodigo = '01'")
            localidad = connection.execute(sql_local, {"ciacodigo": sCodCia}).mappings().fetchone()

            # 3. Inserción con auditoría
            now = datetime.now()
            insert_data = {
                "ciacodigo": sCodCia, "clicodigo": clicodigo, "clinombre": clinombre, "cliruc": cliruc,
                "clidirec": str(data.get("clidirec", "")).upper()[:200],
                "cliidentifica": str(data.get("cliidentifica", "C")).upper()[:1],
                "cliemail": str(data.get("cliemail", "")).lower()[:100],
                "clitelef1": data.get("clitelef1", "")[:15],
                "cliintersec": data.get("cliintersec", "")[:60],
                "clistatus": data.get("clistatus", "A"),
                "activicodigo": localidad["activicodigo"], "regcodigo": localidad["regcodigo"],
                "sectorcodigo": localidad["sectorcodigo"], "tipcodigo": localidad["tipcodigo"],
                "zoncodigo": localidad["zoncodigo"], "procodigo": localidad["procodigo"],
                "ciucodigo": localidad["ciucodigo"], "parrocodigo": localidad["parrocodigo"],
                "cliapliiva": 0, "clibloqueo": 0, "clipersona": "N", "cliorigening": "I", "calificacion": "0",
                "cliidenrep": "O", "cliidencon": "O", "cliconespecial": 0, "tarenviosta": "D", "clicuotaven": 0,
                "clidiapago": 0, "clinommatriz": clinombre, "clidiasrecibefac1": 0, "clidiaentregafac": 0,
                "clidemanda": 0, "clicastigada": 0, "cliparterel": 0, "cliprefac": 1,
                "clifecisys": now.strftime('%Y-%m-%d 00:00:00'), "clihorisys": now.strftime('1900-01-01 %H:%M:%S'),
                "cliusuisys": sUsuario[:10], "cliestisys": sNomEst[:40],
                "clifecmsys": now.strftime('%Y-%m-%d 00:00:00'), "clihormsys": now.strftime('1900-01-01 %H:%M:%S'),
                "cliusumsys": sUsuario[:10], "cliestmsys": sNomEst[:40]
            }

            connection.execute(text("""
                INSERT INTO cxcmcli (ciacodigo, clicodigo, clinombre, cliruc, clidirec, cliidentifica, cliemail, clitelef1, cliintersec, clistatus, activicodigo, regcodigo, sectorcodigo, tipcodigo, zoncodigo, procodigo, ciucodigo, parrocodigo, cliapliiva, clibloqueo, clipersona
                                    , cliorigening, calificacion, cliidenrep, cliidencon, cliconespecial, tarenviosta, clicuotaven, clidiapago, clinommatriz, clidiasrecibefac1, clidiaentregafac, clidemanda, clicastigada, cliparterel, cliprefac, clifecisys, clihorisys, cliusuisys, cliestisys
                                    , clifecmsys, clihormsys, cliusumsys, cliestmsys)
                VALUES (:ciacodigo, :clicodigo, :clinombre, :cliruc, :clidirec, :cliidentifica, :cliemail, :clitelef1, :cliintersec, :clistatus, :activicodigo, :regcodigo, :sectorcodigo, :tipcodigo, :zoncodigo, :procodigo, :ciucodigo, :parrocodigo, :cliapliiva, :clibloqueo, :clipersona,
                                    :cliorigening, :calificacion, :cliidenrep, :cliidencon, :cliconespecial, :tarenviosta, :clicuotaven, :clidiapago, :clinommatriz, :clidiasrecibefac1, :clidiaentregafac, :clidemanda, :clicastigada, :cliparterel, :cliprefac, :clifecisys, :clihorisys, :cliusuisys,
                                    :cliestisys, :clifecmsys, :clihormsys, :cliusumsys, :cliestmsys)
            """), insert_data)

            # Actualizar Secuencia
            connection.execute(text("UPDATE siacsec SET secnumero = :num WHERE ciacodigo = :cia AND seccodigo = 'CLI'"), {"num": nuevo_secnumero, "cia": sCodCia})

    return {"data": f"Cliente creado exitosamente con código {clicodigo}"}
