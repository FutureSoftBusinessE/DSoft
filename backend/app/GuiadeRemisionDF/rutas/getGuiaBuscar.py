from flask import request, jsonify
from app.GuiadeRemisionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/getGuiaBuscar", methods=["POST"])
@cross_origin()
@jwt_required()
def get_guia_buscar():
    """Reconstruye toda la información de una Guía de Remisión para la vista Solo Lectura"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        payload = request.get_json()
        guinumero = payload.get("guinumero")

        if not guinumero:
            return jsonify({"success": False, "message": "No se proporcionó el número de Guía."}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # 1. CABECERA
            query_cab = text(
                """
                SELECT
                    g.guinumero, g.facnumfac, g.guifecha, g.guifecfintrans,
                    g.clinombre, g.cliruc, g.guidirent as direccion_entrega,
                    g.transdescri as transportista, g.transruc, g.guiplacafinal, g.Motivo,
                    g.guistatus, g.sriautnumero
                FROM IncGuia g
                WHERE g.ciacodigo = :ciacodigo AND g.guinumero = :guinumero
            """
            )
            cabecera = connection.execute(query_cab, {"ciacodigo": ciacodigo, "guinumero": guinumero}).mappings().first()

            if not cabecera:
                return jsonify({"success": False, "message": "Guía no encontrada."}), 404

            # 2. DETALLES
            query_det = text(
                """
                SELECT guisecuencia, artcodigo, artdescri, guicantdoc as cantidad
                FROM IntGuia
                WHERE ciacodigo = :ciacodigo AND guinumero = :guinumero
                ORDER BY guisecuencia
            """
            )
            detalles = connection.execute(query_det, {"ciacodigo": ciacodigo, "guinumero": guinumero}).mappings().fetchall()

        cabecera_dict = dict(cabecera)
        cabecera_dict["guifecha"] = cabecera["guifecha"].isoformat() if cabecera["guifecha"] else None
        cabecera_dict["guifecfintrans"] = cabecera["guifecfintrans"].isoformat() if cabecera["guifecfintrans"] else None

        detalles_list = []
        for d in detalles:
            d_dict = dict(d)
            d_dict["cantidad"] = float(d["cantidad"] or 0)
            detalles_list.append(d_dict)

        return jsonify({"success": True, "data": {"data": {"cabecera": cabecera_dict, "detalles": detalles_list}}})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
