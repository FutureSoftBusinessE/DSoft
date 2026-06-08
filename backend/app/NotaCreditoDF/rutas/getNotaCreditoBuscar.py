from flask import request, jsonify
from app.NotaCreditoDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/getNotaCreditoBuscar", methods=["POST"])
@cross_origin()
@jwt_required()
def get_nota_credito_buscar():
    """Reconstruye toda la información de una Nota de Crédito para la vista de Solo Lectura"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        payload = request.get_json()
        nccodigo = payload.get("nccodigo")

        if not nccodigo:
            return jsonify({"success": False, "message": "No se proporcionó el número de Nota de Crédito para la búsqueda."}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # ==========================================
            # 1. OBTENER CABECERA (cxccnc)
            # ==========================================
            query_cabecera = text(
                """
                SELECT
                    nccodigo, facnumfac, ncfecemi, ncfecven,
                    clicodigo, vencodigo, ncstatus, ncdetalle, sriautnumero,
                    ncsubtot, nctotiva, ncmonto
                FROM cxccnc
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                  AND nccodigo = :nccodigo
            """
            )
            cabecera = connection.execute(query_cabecera, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "nccodigo": nccodigo}).mappings().first()

            if not cabecera:
                return jsonify({"success": False, "message": f"La Nota de Crédito {nccodigo} no fue encontrada."}), 404

            # ==========================================
            # 2. OBTENER METADATOS (Cliente, Vendedor)
            # ==========================================
            query_cliente = text(
                """
                SELECT clicodigo, clinombre, cliruc, clitelef1, clidirec
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            """
            )
            cliente = connection.execute(query_cliente, {"ciacodigo": ciacodigo, "clicodigo": cabecera["clicodigo"]}).mappings().first()

            query_vendedor = text(
                """
                SELECT vennombre
                FROM fapvendedor
                WHERE ciacodigo = :ciacodigo AND vencodigo = :vencodigo
            """
            )
            vendedor = connection.execute(query_vendedor, {"ciacodigo": ciacodigo, "vencodigo": cabecera["vencodigo"]}).mappings().first()

            # ==========================================
            # 3. OBTENER DETALLES (cxctnc)
            # ==========================================
            query_detalles = text(
                """
                SELECT
                    t.ncsecuen as secuencia,
                    COALESCE(t.artcodigo, t.sercodigo) as codigo,
                    t.artdescri as descripcion,
                    t.artcantidad as cantidad,
                    t.artpvp as precioUnitario,
                    t.facpordeslin as descuento,
                    t.artiva as iva,
                    t.ncvalor as total
                FROM cxctnc t
                WHERE t.ciacodigo = :ciacodigo
                  AND t.loccodigo = :loccodigo
                  AND t.nccodigo = :nccodigo
                ORDER BY t.ncsecuen
            """
            )
            motivos = connection.execute(query_detalles, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "nccodigo": nccodigo}).mappings().all()

        # ==========================================
        # 4. FORMATEAR RESPUESTA FINAL PARA REACT
        # ==========================================
        cabecera_dict = dict(cabecera)
        cabecera_dict["ncfecemi"] = cabecera["ncfecemi"].isoformat() if cabecera["ncfecemi"] else None
        cabecera_dict["ncfecven"] = cabecera["ncfecven"].isoformat() if cabecera["ncfecven"] else None
        cabecera_dict["ncsubtot"] = float(cabecera["ncsubtot"] or 0)
        cabecera_dict["nctotiva"] = float(cabecera["nctotiva"] or 0)
        cabecera_dict["ncmonto"] = float(cabecera["ncmonto"] or 0)

        motivos_list = []
        for m in motivos:
            m_dict = dict(m)
            m_dict["cantidad"] = float(m["cantidad"] or 0)
            m_dict["precioUnitario"] = float(m["precioUnitario"] or 0)
            m_dict["descuento"] = float(m["descuento"] or 0)
            m_dict["iva"] = float(m["iva"] or 0)
            m_dict["total"] = float(m["total"] or 0)
            motivos_list.append(m_dict)

        return jsonify({"success": True, "data": {"data": {"cabecera": cabecera_dict, "cliente": dict(cliente) if cliente else {}, "vendedor": dict(vendedor) if vendedor else {}, "motivos": motivos_list}}})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al reconstruir la Nota de Crédito: {str(e)}"}), 500
