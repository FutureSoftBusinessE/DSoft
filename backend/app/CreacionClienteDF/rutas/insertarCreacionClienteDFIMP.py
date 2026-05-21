from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.CreacionClienteDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de validación del módulo Creación de Clientes
from app.CreacionClienteDF.rutas.validarCreacionClienteDFIMP import validar_creacionclientedf


@bp.route("/insertarCreacionClienteDFIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarCreacionClienteDFIMP():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)
    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyección de compañía para multitenancy
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 3. Validación previa a la inserción (incluye carga de localidad y secuencias)
            rows, summary = validar_creacionclientedf(connection, columns, required, key_columns, rows_csv, sCodCia)

            # Si existen registros inválidos, frenamos el proceso y devolvemos el feedback
            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación del lote para inserción masiva en la tabla cxcmcli
            to_insert = []
            for fila in rows:
                # Mapeo de campos del CSV y valores técnicos/localidad
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        # Generado en validación
                        "clicodigo": fila["clicodigo"],
                        "clinombre": str(fila.get("clinombre", "")).strip().upper()[:200],
                        "cliruc": str(fila.get("cliruc", "")).strip().upper()[:15],
                        "clidirec": str(fila.get("clidirec", "")).strip().upper()[:200],
                        "cliemail": str(fila.get("cliemail", "")).strip().lower()[:100],
                        "clitelef1": str(fila.get("clitelef1", "")).strip()[:15],
                        # Celular
                        "cliintersec": str(fila.get("cliintersec", "")).strip().upper()[:60],
                        "clistatus": str(fila.get("clistatus", "A")).strip().upper()[:1],
                        "cliidentifica": str(fila.get("cliidentifica", "C")).strip().upper()[:1],
                        # Campos de Localidad (obtenidos de cgblocal)
                        "activicodigo": fila["activicodigo"],
                        "regcodigo": fila["regcodigo"],
                        "sectorcodigo": fila["sectorcodigo"],
                        "tipcodigo": fila["tipcodigo"],
                        "zoncodigo": fila["zoncodigo"],
                        "procodigo": fila["procodigo"],
                        "ciucodigo": fila["ciucodigo"],
                        "parrocodigo": fila["parrocodigo"],

                        # Valores por defecto para campos técnicoscxcmcli
                        "cliapliiva": 0,
                        "clibloqueo": 0,
                        "clipersona": "N",
                        "cliorigening": "I",
                        "calificacion": "0",
                        "cliidenrep": "O",
                        "cliidencon": "O",
                        "cliconespecial": 0,
                        "tarenviosta": "D",
                        "clicuotaven": 0,
                        "clidiapago": 0,
                        "clinommatriz": str(fila.get("clinombre", "")).strip().upper()[:200],
                        "clidiasrecibefac1": 0,
                        "clidiaentregafac": 0,
                        "clidemanda": 0,
                        "clicastigada": 0,
                        "cliparterel": 0,
                        "cliprefac": 1,

                        # Auditoría
                        "clifecisys": fecha_pura,
                        "clihorisys": hora_pura,
                        "cliusuisys": sUsuario[:10],
                        "cliestisys": sNomEst[:40] if sNomEst else "WEB",
                        "clifecmsys": fecha_pura,
                        "clihormsys": hora_pura,
                        "cliusumsys": sUsuario[:10],
                        "cliestmsys": sNomEst[:40] if sNomEst else "WEB",
                    }
                )

            # 5. Ejecución del INSERT masivo
            insert_sql = text(
                """
                INSERT INTO cxcmcli (
                    ciacodigo, clicodigo, clinombre, cliruc, clidirec, cliemail, clitelef1, cliintersec,
                    clistatus, cliidentifica, activicodigo, regcodigo, sectorcodigo, tipcodigo,
                    zoncodigo, procodigo, ciucodigo, parrocodigo, cliapliiva, clibloqueo,
                    clipersona, cliorigening, calificacion, cliidenrep, cliidencon,
                    cliconespecial, tarenviosta, clicuotaven, clidiapago, clinommatriz,
                    clidiasrecibefac1, clidiaentregafac, clidemanda, clicastigada,
                    cliparterel, cliprefac, clifecisys, clihorisys, cliusuisys, cliestisys,
                    clifecmsys, clihormsys, cliusumsys, cliestmsys
                ) VALUES (
                    :ciacodigo, :clicodigo, :clinombre, :cliruc, :clidirec, :cliemail, :clitelef1, :cliintersec,
                    :clistatus, :cliidentifica, :activicodigo, :regcodigo, :sectorcodigo, :tipcodigo,
                    :zoncodigo, :procodigo, :ciucodigo, :parrocodigo, :cliapliiva, :clibloqueo,
                    :clipersona, :cliorigening, :calificacion, :cliidenrep, :cliidencon,
                    :cliconespecial, :tarenviosta, :clicuotaven, :clidiapago, :clinommatriz,
                    :clidiasrecibefac1, :clidiaentregafac, :clidemanda, :clicastigada,
                    :cliparterel, :cliprefac, :clifecisys, :clihorisys, :cliusuisys, :cliestisys,
                    :clifecmsys, :clihormsys, :cliusumsys, :cliestmsys
                )
                """
            )
            connection.execute(insert_sql, to_insert)

            # 6. Actualizar la secuencia en siacsec
            # Se incrementa la secuencia según la cantidad de registros insertados
            nueva_secuencia = int(to_insert[-1]["clicodigo"])
            update_sec_sql = text("""
                UPDATE siacsec
                SET secnumero = :nueva_secuencia
                WHERE ciacodigo = :ciacodigo AND seccodigo = 'CLI'
            """)
            connection.execute(update_sec_sql, {"ciacodigo": sCodCia, "nueva_secuencia": nueva_secuencia})

    return {"data": "Clientes importados exitosamente", "inserted": len(to_insert)}
