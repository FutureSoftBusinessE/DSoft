from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.PlanesServicios import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.PlanesServicios.rutas.validarPlanesServiciosIMP import validar_planes_servicios


@bp.route("/insertarPlanesServiciosIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarPlanesServiciosIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    now = datetime.now()

    data = request.get_json()

    # Son las columnas de la tabla
    columns = data.get("columns")

    # Son las columnas que no pueden estar vacías (obligatorias)
    required = data.get("required")

    # Son las columnas que forman la clave (para las validaciones)
    key_columns = data.get("key_columns")

    # Son las filas con los datos del csv
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyectar ciacodigo desde JWT si la tabla lo usa como clave
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            rows, summary = validar_planes_servicios(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # insert
            to_insert = []

            for fila in rows:
                # MODIFICADO: Convertir artapliiva de string a INT para guardar en inmart
                artapliiva_valor = fila.get("artapliiva", "0")
                try:
                    artapliiva_int = int(str(artapliiva_valor))
                except (ValueError, TypeError):
                    artapliiva_int = 0

                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "invcodigo": fila.get("invcodigo"),
                        "artcodigo": fila.get("artcodigo"),
                        "artdescri": fila.get("artdescri"),
                        "lincodigo": "000000",
                        "marcodigo": "S/M",
                        "medcodigo": "SM",
                        "precodigo": "SP",
                        "artprecventa1": float(fila.get("artprecventa1", 0)),
                        "artapliiva": artapliiva_int,  # MODIFICADO: Ahora es INT
                        "artstatus": "A",
                        "artalias": fila.get("artdescri"),
                        "artdecimal": 0,
                        "artserie": 0,
                        "artpeso": 0,
                        "artminimo": 0,
                        "artmaximo": 0,
                        "artdiasrep": 0,
                        "artdiasseg": 0,
                        "artfrelleg": 0,
                        "artcantinicial": 0,
                        "artcantactual": 0,
                        "artcanttranfer": 0,
                        "artcantimporta": 0,
                        "artprodven": 0,
                        "artservicio": 0,
                        "artcobraiva": 0,
                        "artcostoinicial": 0,
                        "artcostoactual": 0,
                        "artcostoinidol": 0,
                        "artcostoactdol": 0,
                        "artprecventa2": 0,
                        "artprecventa3": 0,
                        "artprecventa4": 0,
                        "artprecventa5": 0,
                        "artprecventa6": 0,
                        "artprevendol1": 0,
                        "artprevendol2": 0,
                        "artprevendol3": 0,
                        "artprevendol4": 0,
                        "artprevendol5": 0,
                        "artprevendol6": 0,
                        "artpordes": 0,
                        "artmondes": 0,
                        "artaplipro": 0,
                        "artexpins": 0,
                        "vencomision": 0,
                        "refcomision": 0,
                        "artfecisys": now,
                        "arthorisys": now,
                        "artusuisys": sUsuario,
                        "artfecmsys": now,
                        "arthormsys": now,
                        "artusumsys": sUsuario,
                        "artfeccos": now,
                        "arthorcos": now,
                        "artusucos": "",
                        "artfecpre": now,
                        "arthorpre": now,
                        "artusupre": sUsuario,
                        "artdesporcant": 0,
                        "artdiasgarven": 0,
                        "artdiasgarcom": 0,
                        "artapliret": 0,
                        "artporrec": 0,
                        "artmonrec": 0,
                        "artvehiculo": 0,
                        "artimpseriecer": 0,
                        "artsincosto": 0,
                        "artcantcergarantia": 0,
                        "artseriedesp": 0,
                    }
                )

            insert_sql = text(
                """
                INSERT INTO inmart (
                    ciacodigo, invcodigo, artcodigo, artdescri,
                    lincodigo, marcodigo, medcodigo, precodigo,
                    artprecventa1, artapliiva, artstatus, artalias,
                    artdecimal, artserie, artpeso, artminimo, artmaximo,
                    artdiasrep, artdiasseg, artfrelleg,
                    artcantinicial, artcantactual, artcanttranfer, artcantimporta,
                    artprodven, artservicio, artcobraiva,
                    artcostoinicial, artcostoactual, artcostoinidol, artcostoactdol,
                    artprecventa2, artprecventa3, artprecventa4, artprecventa5, artprecventa6,
                    artprevendol1, artprevendol2, artprevendol3, artprevendol4, artprevendol5, artprevendol6,
                    artpordes, artmondes, artaplipro, artexpins,
                    vencomision, refcomision, artfecisys, arthorisys, artusuisys,
                    artfecmsys, arthormsys, artusumsys, artfeccos, arthorcos, artusucos,
                    artfecpre, arthorpre, artusupre, artdesporcant, artdiasgarven, artdiasgarcom,
                    artapliret, artporrec, artmonrec, artvehiculo, artimpseriecer, artsincosto,
                    artcantcergarantia, artseriedesp
                ) VALUES (
                    :ciacodigo, :invcodigo, :artcodigo, :artdescri,
                    :lincodigo, :marcodigo, :medcodigo, :precodigo,
                    :artprecventa1, :artapliiva, :artstatus, :artalias,
                    :artdecimal, :artserie, :artpeso, :artminimo, :artmaximo,
                    :artdiasrep, :artdiasseg, :artfrelleg,
                    :artcantinicial, :artcantactual, :artcanttranfer, :artcantimporta,
                    :artprodven, :artservicio, :artcobraiva,
                    :artcostoinicial, :artcostoactual, :artcostoinidol, :artcostoactdol,
                    :artprecventa2, :artprecventa3, :artprecventa4, :artprecventa5, :artprecventa6,
                    :artprevendol1, :artprevendol2, :artprevendol3, :artprevendol4, :artprevendol5, :artprevendol6,
                    :artpordes, :artmondes, :artaplipro, :artexpins,
                    :vencomision, :refcomision, :artfecisys, :arthorisys, :artusuisys,
                    :artfecmsys, :arthormsys, :artusumsys, :artfeccos, :arthorcos, :artusucos,
                    :artfecpre, :arthorpre, :artusupre, :artdesporcant, :artdiasgarven, :artdiasgarcom,
                    :artapliret, :artporrec, :artmonrec, :artvehiculo, :artimpseriecer, :artsincosto,
                    :artcantcergarantia, :artseriedesp
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Planes de servicios insertados exitosamente",
        "rows": rows,
        "summary": summary,
        "inserted": len(to_insert),
    }
