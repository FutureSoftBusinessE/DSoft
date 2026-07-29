from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos el helper de validación que creamos en el paso anterior
from app.CatalogodeProductos.rutas.validarCatalogodeProductosIMP import (
    validar_catalogodeproductos,
)


@bp.route("/insertarCatalogodeProductosIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarCatalogodeProductosIMP():
    # 1. Extracción de sesión[cite: 10]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    # sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras[cite: 10]
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

    # 3. Inyectar ciacodigo desde JWT a todas las filas[cite: 10]
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 4. Validación de seguridad final antes de insertar[cite: 10]
            rows, summary = validar_catalogodeproductos(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 5. Preparación de datos limpios para inserción masiva[cite: 10]
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "invcodigo": str(fila.get("invcodigo", "")).strip().upper()[:2],
                        "artcodigo": str(fila.get("artcodigo", "")).strip().upper()[:15],
                        "artnumparte": str(fila.get("artnumparte", ""))[:120],
                        "artdescri": str(fila.get("artdescri", "")).strip().upper()[:300],
                        "lincodigo": str(fila.get("lincodigo", "")).strip().upper()[:20],
                        "marcodigo": str(fila.get("marcodigo", "")).strip().upper()[:5],
                        "medcodigo": str(fila.get("medcodigo", "")).strip().upper()[:3],
                        "precodigo": str(fila.get("precodigo", "")).strip().upper()[:2],
                        "artpeso": float(fila.get("artpeso", 0.0)),
                        "artminimo": float(fila.get("artminimo", 0.0)),
                        "artmaximo": float(fila.get("artmaximo", 0.0)),
                        "artdiasrep": int(fila.get("artdiasrep", 0)),
                        "artdiasseg": int(fila.get("artdiasseg", 0)),
                        "artfrelleg": int(fila.get("artfrelleg", 0)),
                        "artcantinicial": 0.0,
                        "artcantactual": 0.0,
                        "artcanttranfer": 0.0,
                        "artcantimporta": 0.0,
                        "artstatus": str(fila.get("artstatus", "A")).strip().upper()[:1],
                        "artprodven": int(fila.get("artprodven", 1)),
                        "artservicio": int(fila.get("artservicio", 0)),
                        "artapliiva": int(fila.get("artapliiva", 1)),
                        "artcobraiva": 0.0,
                        "artcostoinicial": 0.0,
                        "artcostoactual": 0.0,
                        "artcostoinidol": 0.0,
                        "artcostoactdol": 0.0,
                        "artprecventa1": float(fila.get("artprecventa1", 0.0)),
                        "artprecventa2": float(fila.get("artprecventa2", 0.0)),
                        "artprecventa3": float(fila.get("artprecventa3", 0.0)),
                        "artprecventa4": float(fila.get("artprecventa4", 0.0)),
                        "artprecventa5": float(fila.get("artprecventa5", 0.0)),
                        "artprecventa6": float(fila.get("artprecventa6", 0.0)),
                        "artprevendol1": float(fila.get("artprevendol1", 0.0)),
                        "artprevendol2": float(fila.get("artprevendol2", 0.0)),
                        "artprevendol3": float(fila.get("artprevendol3", 0.0)),
                        "artprevendol4": float(fila.get("artprevendol4", 0.0)),
                        "artprevendol5": float(fila.get("artprevendol5", 0.0)),
                        "artprevendol6": float(fila.get("artprevendol6", 0.0)),
                        "artpordes": float(fila.get("artpordes", 0.0)),
                        "artmondes": float(fila.get("artmondes", 0.0)),
                        "artaplipro": int(fila.get("artaplipro", 0)),
                        "artexpins": int(fila.get("artexpins", 0)),
                        "vencomision": float(fila.get("vencomision", 0.0)),
                        "refcomision": float(fila.get("refcomision", 0.0)),
                        "artdesporcant": int(fila.get("artdesporcant", 0)),
                        "artserie": int(fila.get("artserie", 0)),
                        "artseriedesp": int(fila.get("artseriedesp", 0)),
                        "artdiasgarven": int(fila.get("artdiasgarven", 0)),
                        "artdiasgarcom": int(fila.get("artdiasgarcom", 0)),
                        "artapliret": int(fila.get("artapliret", 1)),
                        "artvehiculo": int(fila.get("artvehiculo", 0)),
                        "artdecimal": int(fila.get("artdecimal", 0)),
                        "artfaccero": int(fila.get("artfaccero", 0)),
                        "artbloqueocompra": int(fila.get("artbloqueocompra", 0)),
                        "artlote": int(fila.get("artlote", 0)),
                        "artvalidaN1": int(fila.get("artvalidaN1", 0)),
                        "artporvidutil": 0.0,
                        "artstockporent": 0.0,
                        "artimpseriecer": int(fila.get("artimpseriecer", 0)),
                        "artsincosto": int(fila.get("artsincosto", 0)),
                        "artcantcergarantia": int(fila.get("artcantcergarantia", 0)),
                        "paiscodigo": str(fila.get("paiscodigo", ""))[:3],
                        "tipserie": str(fila.get("tipserie", ""))[:1],
                        "jefecodigo": str(fila.get("jefecodigo", ""))[:6],
                        "sercodigo": str(fila.get("sercodigo", ""))[:5],
                        "calfcodigo": str(fila.get("calfcodigo", ""))[:15],
                        "inencodigo": str(fila.get("inencodigo", ""))[:10],
                        "artetiqueta": str(fila.get("artetiqueta", "S"))[:3],
                        "artalias": str(fila.get("artalias", ""))[:300],
                        "artcomentari": str(fila.get("artcomentari", ""))[:100],
                        "artobserva": str(fila.get("artobserva", ""))[:255],
                        "artweb": str(fila.get("artweb", ""))[:80],
                        "artconcentra": str(fila.get("artconcentra", ""))[:100],
                        "artcantrecip": str(fila.get("artcantrecip", ""))[:20],
                        "artregissani": str(fila.get("artregissani", ""))[:20],
                        "artnumregsan": str(fila.get("artnumregsan", ""))[:20],
                        "artarancel": str(fila.get("artarancel", ""))[:255],
                        "artcodpartida": str(fila.get("artcodpartida", ""))[:15],
                        "artporpartida": float(fila.get("artporpartida", 0.0)),
                        "artprov4": str(fila.get("artprov4", ""))[:15],
                        # Auditoría separada en fechas y horas puras[cite: 10]
                        "artfecisys": fecha_pura,
                        "arthorisys": hora_pura,
                        "artusuisys": str(sUsuario)[:10],
                        "artfecmsys": fecha_pura,
                        "arthormsys": hora_pura,
                        "artusumsys": str(sUsuario)[:10],
                        "artfeccos": fecha_pura,
                        "arthorcos": hora_pura,
                        "artusucos": str(sUsuario)[:10],
                        "artfecpre": fecha_pura,
                        "arthorpre": hora_pura,
                        "artusupre": str(sUsuario)[:10],
                    }
                )

            # 6. Ejecución optimizada de SQL[cite: 10]
            # Extraemos las llaves del primer diccionario para formar la consulta de inserción dinámica
            columnas = ", ".join(to_insert[0].keys())
            valores = ", ".join([f":{key}" for key in to_insert[0].keys()])

            insert_sql = text(
                f"""
                INSERT INTO inmart ({columnas})
                VALUES ({valores})
                """
            )

            connection.execute(insert_sql, to_insert)

    return {
        "data": "Productos insertados exitosamente en el catálogo",
        "inserted": len(to_insert),
    }
