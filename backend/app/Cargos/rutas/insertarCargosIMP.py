from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Cargos import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función helper que creamos en el archivo anterior
from app.Cargos.rutas.validarCargosIMP import validar_cargo


# Ajusta tu función de desencriptación de ser necesario
def desencriptar_mock(texto):
    return texto


@bp.route("/insertarCargosIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarCargosIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # Extraemos el usuario (ajusta la llave según tu login como en tus otros módulos)
    usuario_encriptado = claims.get("user") or claims["seleccion"].get("cliciaidenti")
    sUsuario = desencriptar_mock(usuario_encriptado)
    if sUsuario:
        sUsuario = str(sUsuario)[:10]
    else:
        sUsuario = "admin"

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
            # Ejecutamos la misma validación estricta para evitar inyecciones directas
            rows, summary = validar_cargo(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "cargocodigo": str(fila.get("cargocodigo", ""))[:5].upper(),
                        "cargodescri": str(fila.get("cargodescri", ""))[:50].upper(),
                        "carsueldo": float(fila.get("carsueldo", 0) or 0),
                        "carrepresen": float(fila.get("carrepresen", 0) or 0),
                        "cargostatus": str(fila.get("cargostatus", "A"))[:1].upper(),
                        "cargofecisys": fecha_pura,
                        "cargohorisys": hora_pura,
                        "cargousuisys": sUsuario,
                        "cargofecmsys": fecha_pura,
                        "cargohormsys": hora_pura,
                        "cargousumsys": sUsuario,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO rhbcargos (
                    ciacodigo, cargocodigo, cargodescri, carsueldo, carrepresen, cargostatus,
                    cargofecisys, cargohorisys, cargousuisys,
                    cargofecmsys, cargohormsys, cargousumsys,
                    carresiden, carrespon, tipempvalhor, tipempvaldia, tipempvalsem
                ) VALUES (
                    :ciacodigo, :cargocodigo, :cargodescri, :carsueldo, :carrepresen, :cargostatus,
                    :cargofecisys, :cargohorisys, :cargousuisys,
                    :cargofecmsys, :cargohormsys, :cargousumsys,
                    0, 0, 0, 0, 0
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Cargos insertados exitosamente", "inserted": len(to_insert)}
