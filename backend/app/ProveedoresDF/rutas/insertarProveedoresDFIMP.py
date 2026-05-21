from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ProveedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importamos la función de validación
from app.ProveedoresDF.rutas.validarProveedoresDFIMP import validar_proveedoresdf


@bp.route("/insertarProveedoresDFIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarProveedoresDFIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 1. Validación previa
            rows, summary = validar_proveedoresdf(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 2. Obtener secuencia inicial
            sql_sec = text("SELECT secnumero FROM siacsec WHERE ciacodigo = :cia AND seccodigo = 'PRO'")
            res_sec = connection.execute(sql_sec, {"cia": sCodCia}).mappings().fetchone()

            if not res_sec:
                raise ValidationError("No se encontró la configuración de secuencia 'PRO'.")

            sec_actual = int(res_sec["secnumero"])

            # 3. Preparación del lote masivo
            to_insert = []
            for fila in rows:
                # Incrementamos antes de asignar
                sec_actual += 1
                pro_codigo_gen = str(sec_actual).zfill(6)

                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "procodigo": pro_codigo_gen,
                        "procalif": str(fila.get("Tipo de Identificacion", "R")).strip().upper()[:1],
                        "proruc": str(fila.get("Cedula o Ruc", "")).strip()[:20],
                        "pronombre": str(fila.get("Nombre", "")).strip().upper()[:200],
                        "pronommat": str(fila.get("Razon Social", fila.get("Nombre", ""))).strip().upper()[:200],
                        "prodirec": str(fila.get("Direccion", "")).strip().upper()[:200],
                        "proemail": str(fila.get("Email", "")).strip().lower()[:100],
                        "protelef1": str(fila.get("Telefono", ""))[:15],
                        "procelu": str(fila.get("Celular", ""))[:15],
                        "prostatus": str(fila.get("Estado", "A")).strip().upper()[:1],
                        "prorepres": "",
                        "propais": "ECUADOR",
                        "prociudad": "GUAYAQUIL",
                        "prosaldosuc": 0.0,
                        "prosaldodol": 0.0,
                        "proesperjur": 0,
                        "proesconesp": 0,
                        "procambiaimp": 0,
                        "prodiacre": 0,
                        "procuo": 1,
                        "procuota": 0.0,
                        "prodescuento": 0.0,
                        "prolistaprecio": 1,
                        "proparterel": "N",
                        "proaplicaGar": "0",
                        "progardias": 0,
                        "proaplicaContr": "0",
                        "procontrdias": 0,
                        "proaplicarebate": "0",
                        "profecisys": fecha_pura,
                        "prohorisys": hora_pura,
                        "prousuisys": sUsuario[:10],
                        "profecmsys": fecha_pura,
                        "prohormsys": hora_pura,
                        "prousumsys": sUsuario[:10],
                    }
                )

            # 4. Ejecución del lote masivo
            insert_sql = text(
                """
                INSERT INTO cxpmprov (
                    ciacodigo, procodigo, procalif, proruc, pronombre, pronommat,
                    prodirec, proemail, protelef1, procelu, prostatus,
                    prorepres, propais, prociudad, prosaldosuc, prosaldodol,
                    proesperjur, proesconesp, procambiaimp, prodiacre,
                    procuo, procuota, prodescuento, prolistaprecio, proparterel,
                    proaplicaGar, progardias, proaplicaContr, procontrdias, proaplicarebate,
                    profecisys, prohorisys, prousuisys, profecmsys, prohormsys, prousumsys
                ) VALUES (
                    :ciacodigo, :procodigo, :procalif, :proruc, :pronombre, :pronommat,
                    :prodirec, :proemail, :protelef1, :procelu, :prostatus,
                    :prorepres, :propais, :prociudad, :prosaldosuc, :prosaldodol,
                    :proesperjur, :proesconesp, :procambiaimp, :prodiacre,
                    :procuo, :procuota, :prodescuento, :prolistaprecio, :proparterel,
                    :proaplicaGar, :progardias, :proaplicaContr, :procontrdias, :proaplicarebate,
                    :profecisys, :prohorisys, :prousuisys, :profecmsys, :prohormsys, :prousumsys
                )
            """
            )
            connection.execute(insert_sql, to_insert)

            # 5. Actualizar la secuencia final
            update_sec_sql = text("UPDATE siacsec SET secnumero = :nuevo WHERE ciacodigo = :cia AND seccodigo = 'PRO'")
            connection.execute(update_sec_sql, {"nuevo": sec_actual, "cia": sCodCia})

    return {"data": "Proveedores importados exitosamente", "inserted": len(to_insert)}
