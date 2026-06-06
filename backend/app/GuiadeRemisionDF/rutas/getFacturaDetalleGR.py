from flask import jsonify, request
from app.GuiadeRemisionDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/getFacturaDetalleGR", methods=["POST"])
@jwt_required()
def get_factura_detalle_gr():
    """Obtiene el cliente y los artículos de una Factura específica para la Guía de Remisión"""
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
            # 1. Obtener la cabecera (Para ubicar al cliente)
            query_cabecera = text(
                """
                SELECT clicodigo
                FROM facfac
                WHERE ciacodigo = :ciacodigo
                  AND facnumfac = :facnumfac
                  AND loccodigo = :loccodigo
            """
            )
            cabecera = connection.execute(query_cabecera, {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().first()

            if not cabecera:
                return jsonify({"success": False, "message": f"No se encontró la factura {facnumfac}"}), 404

            # 2. Extraer datos del cliente (cxcmcli)
            query_cliente = text(
                """
                SELECT clicodigo, clinombre, cliruc, clidirec, clitelef1, cliemail
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                  AND clicodigo = :clicodigo
            """
            )
            cliente_info = connection.execute(query_cliente, {"ciacodigo": ciacodigo, "clicodigo": cabecera["clicodigo"]}).mappings().first()

            # 3. Extraer detalles de productos (fatfac cruzado con inmart)
            query_detalles = text(
                """
                SELECT
                    f.artcodigo,
                    COALESCE(a.artdescri, f.artdescri) as artdescri,
                    f.faccantidad
                FROM fatfac f
                LEFT JOIN inmart a ON f.ciacodigo = a.ciacodigo AND f.artcodigo = a.artcodigo
                WHERE f.ciacodigo = :ciacodigo
                  AND f.facnumfac = :facnumfac
                  AND f.loccodigo = :loccodigo
                ORDER BY f.facsecuen
            """
            )
            detalles = connection.execute(query_detalles, {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().all()

            # Formatear productos
            productos_data = [{"artcodigo": det["artcodigo"].strip() if det["artcodigo"] else "", "artdescri": det["artdescri"].strip() if det["artdescri"] else "", "cantidad": float(det["faccantidad"] or 0)} for det in detalles]

        return jsonify({"success": True, "data": {"cliente": dict(cliente_info) if cliente_info else {}, "productos": productos_data}})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al extraer detalle de factura: {str(e)}"}), 500
