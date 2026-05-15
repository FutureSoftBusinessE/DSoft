from app.FacturaDesdeArticulos import bp
from app.extensions import db
from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.utils.get_info_product import get_info_product
import base64


@bp.route("/getTOP30Articulos", methods=["POST"])
@cross_origin()
@jwt_required()
def getTOP30Articulos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()
    clicodigo = data.get("clicodigo", "")
    factippag = data.get("factippag", "")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # Si no pasa el clicodigo buscar el cliente final automaticamente
                if not clicodigo:
                    # Consulta para obtener el código del cliente final
                    query_cliente_final = """
                        SELECT clicodigo
                        FROM cxcmcli
                        WHERE ciacodigo = :ciacodigo
                        AND cliidentifica = 'F'
                    """
                    response_cliente_final = connection.execute(text(query_cliente_final), {"ciacodigo": ciacodigo}).mappings().first()
                    clicodigo = response_cliente_final["clicodigo"]

                # Verificar si existen facturas en los últimos 60 días
                sSql_verificar_facturas = """
                    SELECT COUNT(*) as total
                    FROM fatfac
                    WHERE ciacodigo = :ciacodigo
                        AND factipo = 'FA'
                        AND facstatus <> 'A'
                        AND facfecemi >= GETDATE() - 60
                """

                result_verificar = connection.execute(text(sSql_verificar_facturas), {"ciacodigo": ciacodigo}).mappings().first()

                tiene_facturas = result_verificar["total"] > 0 if result_verificar else False

                # Obtener TOP 30 artículos
                if tiene_facturas:
                    sSql_articulos = """
                        SELECT TOP 30
                            COUNT(*) AS cantidad_vendida,
                            artcodigo
                        FROM fatfac
                        WHERE ciacodigo = :ciacodigo
                            AND factipo = 'FA'
                            AND facstatus <> 'A'
                            AND facfecemi >= GETDATE() - 60
                        GROUP BY artcodigo
                        HAVING COUNT(*) > 10
                        ORDER BY COUNT(*) DESC
                    """
                else:
                    sSql_articulos = """
                        SELECT TOP 30
                            artcodigo,
                            0 AS cantidad_vendida
                        FROM inmart
                        WHERE ciacodigo = :ciacodigo
                            AND artstatus = 'A'
                        ORDER BY artcodigo
                    """

                result_articulos = connection.execute(text(sSql_articulos), {"ciacodigo": ciacodigo}).mappings().all()

                codigos = [row["artcodigo"] for row in result_articulos]

                if not codigos:
                    return jsonify({"data": []})

                # Obtener información completa de cada artículo
                info_data = []

                for artcodigo in codigos:
                    try:
                        info_producto = get_info_product(conn=connection, ciacodigo=ciacodigo, loccodigo=loccodigo, artcodigo=artcodigo, clicodigo=clicodigo, factippag=factippag)

                        sSql_info_base = """
                            SELECT
                                artdescri,
                                artcodigo,
                                meddescri,
                                predescri,
                                lindescri,
                                artcantactual,
                                mardescri,
                                artservicio,
                                artapliiva
                            FROM view_inmart
                            WHERE artcodigo = :artcodigo
                            AND ciacodigo = :ciacodigo
                        """

                        info_base = connection.execute(text(sSql_info_base), {"artcodigo": artcodigo, "ciacodigo": ciacodigo}).mappings().first()

                        if not info_base:
                            continue

                        sSql_imagen = """
                            SELECT artimagen
                            FROM intimagen
                            WHERE ciacodigo = :ciacodigo
                            AND artcodigo = :artcodigo
                        """

                        result_imagen = connection.execute(text(sSql_imagen), {"ciacodigo": ciacodigo, "artcodigo": artcodigo}).mappings().first()

                        producto = {
                            "artcodigo": artcodigo,
                            "artdescri": info_base["artdescri"],
                            "meddescri": info_base["meddescri"],
                            "predescri": info_base["predescri"],
                            "lindescri": info_base["lindescri"],
                            "artcantactual": float(info_base["artcantactual"]) if info_base["artcantactual"] else 0,
                            "mardescri": info_base["mardescri"],
                            "esServicio": info_base["artservicio"] != 0,
                            "artservicio": info_base["artservicio"],
                            "precioUnitario": float(info_producto["precioUnitario"]),
                            "ivaPorcentaje": float(info_producto["ivaProductoPorcentaje"]),
                            "artapliiva": info_base["artapliiva"],
                            "descuentoPorcentaje": float(info_producto["descuentoPorcentaje"]),
                            "imagen": base64.b64encode(result_imagen["artimagen"]).decode("utf-8").replace("\n", "") if result_imagen and result_imagen["artimagen"] else None,
                        }

                        info_data.append(producto)

                    except Exception as e:
                        print(f"Error obteniendo producto {artcodigo}: {str(e)}")
                        continue

                return jsonify({"data": info_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/getArticulosConFiltros", methods=["POST"])
@cross_origin()
@jwt_required()
def getArticulosConFiltros():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()
    clicodigo = data.get("clicodigo", "")
    factippag = data.get("factippag", "")
    filtros = data.get("filtros", {})

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # Si no pasa el clicodigo buscar el cliente final automaticamente
                if not clicodigo:
                    # Consulta para obtener el código del cliente final
                    query_cliente_final = """
                        SELECT clicodigo
                        FROM cxcmcli
                        WHERE ciacodigo = :ciacodigo
                        AND cliidentifica = 'F'
                    """
                    response_cliente_final = connection.execute(text(query_cliente_final), {"ciacodigo": ciacodigo}).mappings().first()
                    clicodigo = response_cliente_final["clicodigo"]

                # Construir consulta base
                sSql_articulos = """
                    SELECT DISTINCT im.artcodigo
                    FROM inmart im
                    WHERE im.ciacodigo = :ciacodigo
                        AND im.artstatus = 'A'
                """

                params = {"ciacodigo": ciacodigo}

                # Filtro por códigos de artículo
                if filtros.get("codigos") and len(filtros["codigos"]) > 0:
                    placeholders = ",".join([f":codigo_{i}" for i in range(len(filtros["codigos"]))])
                    sSql_articulos += f" AND im.artcodigo IN ({placeholders})"
                    for i, codigo in enumerate(filtros["codigos"]):
                        params[f"codigo_{i}"] = codigo

                # Filtro por presentación
                if filtros.get("presentacion") and len(filtros["presentacion"]) > 0:
                    placeholders = ",".join([f":precodigo_{i}" for i in range(len(filtros["presentacion"]))])
                    sSql_articulos += f" AND im.precodigo IN ({placeholders})"
                    for i, precodigo in enumerate(filtros["presentacion"]):
                        params[f"precodigo_{i}"] = precodigo

                # Filtro por marca
                if filtros.get("marca") and len(filtros["marca"]) > 0:
                    placeholders = ",".join([f":marcodigo_{i}" for i in range(len(filtros["marca"]))])
                    sSql_articulos += f" AND im.marcodigo IN ({placeholders})"
                    for i, marcodigo in enumerate(filtros["marca"]):
                        params[f"marcodigo_{i}"] = marcodigo

                # Filtro por medida
                if filtros.get("medida") and len(filtros["medida"]) > 0:
                    placeholders = ",".join([f":medcodigo_{i}" for i in range(len(filtros["medida"]))])
                    sSql_articulos += f" AND im.medcodigo IN ({placeholders})"
                    for i, medcodigo in enumerate(filtros["medida"]):
                        params[f"medcodigo_{i}"] = medcodigo

                # Filtro por línea
                if filtros.get("linea") and len(filtros["linea"]) > 0:
                    placeholders = ",".join([f":lincodigo_{i}" for i in range(len(filtros["linea"]))])
                    sSql_articulos += f" AND im.lincodigo IN ({placeholders})"
                    for i, lincodigo in enumerate(filtros["linea"]):
                        params[f"lincodigo_{i}"] = lincodigo

                # Filtro por IMR/EMR
                if filtros.get("imr"):
                    sSql_articulos += " AND im.invcodigo = :imr"
                    params["imr"] = filtros["imr"]

                # Filtro por stock
                if filtros.get("soloConStock", False):
                    sSql_articulos += " AND im.artcantactual > 0"

                # Limitar resultados
                sSql_articulos += " ORDER BY im.artcodigo OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY"

                result_articulos = connection.execute(text(sSql_articulos), params).mappings().all()

                codigos = [row["artcodigo"] for row in result_articulos]

                if not codigos:
                    return jsonify({"data": []})

                # Obtener información completa de cada artículo (reutilizar la misma lógica)
                info_data = []

                for artcodigo in codigos:
                    try:
                        info_producto = get_info_product(conn=connection, ciacodigo=ciacodigo, loccodigo=loccodigo, artcodigo=artcodigo, clicodigo=clicodigo, factippag=factippag)

                        sSql_info_base = """
                            SELECT
                                artdescri,
                                artcodigo,
                                meddescri,
                                predescri,
                                lindescri,
                                artcantactual,
                                mardescri,
                                artservicio,
                                artapliiva
                            FROM view_inmart
                            WHERE artcodigo = :artcodigo
                            AND ciacodigo = :ciacodigo
                        """

                        info_base = connection.execute(text(sSql_info_base), {"artcodigo": artcodigo, "ciacodigo": ciacodigo}).mappings().first()

                        if not info_base:
                            continue

                        sSql_imagen = """
                            SELECT artimagen
                            FROM intimagen
                            WHERE ciacodigo = :ciacodigo
                            AND artcodigo = :artcodigo
                        """

                        result_imagen = connection.execute(text(sSql_imagen), {"ciacodigo": ciacodigo, "artcodigo": artcodigo}).mappings().first()

                        producto = {
                            "artcodigo": artcodigo,
                            "artdescri": info_base["artdescri"],
                            "meddescri": info_base["meddescri"],
                            "predescri": info_base["predescri"],
                            "lindescri": info_base["lindescri"],
                            "artcantactual": float(info_base["artcantactual"]) if info_base["artcantactual"] else 0,
                            "mardescri": info_base["mardescri"],
                            "esServicio": info_base["artservicio"] != 0,
                            "artservicio": info_base["artservicio"],
                            "precioUnitario": float(info_producto["precioUnitario"]),
                            "ivaPorcentaje": float(info_producto["ivaProductoPorcentaje"]),
                            "artapliiva": info_base["artapliiva"],
                            "descuentoPorcentaje": float(info_producto["descuentoPorcentaje"]),
                            "imagen": base64.b64encode(result_imagen["artimagen"]).decode("utf-8").replace("\n", "") if result_imagen and result_imagen["artimagen"] else None,
                        }

                        info_data.append(producto)

                    except Exception as e:
                        print(f"Error obteniendo producto {artcodigo}: {str(e)}")
                        continue

                return jsonify({"data": info_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
