from flask import jsonify, request
from app.NotaCreditoDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/getFacturaDetalleNC", methods=["POST"])
@cross_origin()
@jwt_required()
def get_factura_detalle_nc():
    """Obtiene los artículos y el cliente de una Factura para Notas de Crédito"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        data = request.get_json()
        facnumfac = data.get("facnumfac")

        if not facnumfac:
            return jsonify({"success": False, "message": "Número de factura requerido"}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # 1. Obtener la cabecera para identificar al cliente
            query_cab = text("SELECT clicodigo FROM facfac WHERE ciacodigo = :c AND facnumfac = :f AND loccodigo = :l")
            cabecera = connection.execute(query_cab, {"c": ciacodigo, "f": facnumfac, "l": loccodigo}).mappings().first()

            if not cabecera:
                return jsonify({"success": False, "message": f"No se encontró la factura {facnumfac}"}), 404

            # 2. Obtener la información del Cliente (La fuente de la verdad)
            query_cli = text("SELECT clicodigo, clinombre, cliruc FROM cxcmcli WHERE ciacodigo = :c AND clicodigo = :cli")
            cliente = connection.execute(query_cli, {"c": ciacodigo, "cli": cabecera["clicodigo"]}).mappings().first()

            # 3. Obtener Detalles (Productos / Servicios)
            query_detalles = text(
                """
                SELECT
                    COALESCE(f.artcodigo, f.sercodigo) as artcodigo,
                    COALESCE(a.artdescri, f.artdescri) as artdescri,
                    f.facpreven,
                    f.facpordesc,
                    f.faciva,
                    f.invcodigo,
                    f.bodcodigo,
                    (COALESCE(f.faccantidad, 0) - COALESCE(f.faccantnc, 0)) as saldo_pendiente,
                    f.facsecuen
                FROM fatfac f
                LEFT JOIN inmart a ON f.ciacodigo = a.ciacodigo AND f.artcodigo = a.artcodigo
                WHERE f.ciacodigo = :c
                  AND f.facnumfac = :f
                  AND f.loccodigo = :l
                ORDER BY f.facsecuen
            """
            )
            detalles = connection.execute(query_detalles, {"c": ciacodigo, "f": facnumfac, "l": loccodigo}).mappings().all()

            productos_data = [
                {
                    "artcodigo": det["artcodigo"].strip() if det["artcodigo"] else "SIN-CODIGO",
                    "artdescri": det["artdescri"].strip() if det["artdescri"] else "ARTICULO / SERVICIO",
                    "precioUnitario": float(det["facpreven"] or 0),
                    "descuentoPorcentaje": float(det["facpordesc"] or 0),
                    "ivaPorcentaje": float(det["faciva"] or 0),
                    "cantidad_maxima": max(float(det["saldo_pendiente"] or 0), 0),
                    "cantidad": max(float(det["saldo_pendiente"] or 0), 0),
                    "invcodigo": det["invcodigo"].strip() if det["invcodigo"] else "01",
                    "bodcodigo": det["bodcodigo"].strip() if det["bodcodigo"] else "MAT",
                    "facsecuen": det["facsecuen"],
                }
                for det in detalles
            ]

        # Retornamos estructurado: cliente + productos
        return jsonify({"success": True, "data": {"cliente": dict(cliente) if cliente else {}, "productos": productos_data}})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error interno al extraer detalle: {str(e)}"}), 500
