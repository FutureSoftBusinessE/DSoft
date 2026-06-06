from flask import request, jsonify
from app.NotaDebitoDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/getNotaDebitoBuscar", methods=["POST"])
@jwt_required()
def get_nota_debito_buscar():
    """Reconstruye toda la información de una Nota de Débito para la vista de Solo Lectura"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        payload = request.get_json()
        facnumfac = payload.get("facnumfac")

        if not facnumfac:
            return jsonify({"success": False, "message": "No se proporcionó el número de Nota de Débito para la búsqueda."}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # ==========================================
            # 1. OBTENER CABECERA (facfac)
            # ==========================================
            query_cabecera = text(
                """
                SELECT
                    facnumfac, facnumref, facfecemi, facfecven, factippag,
                    clicodigo, vencodigo, facstatus, facdetalle, sriautnumero,
                    facsubtot, faciva, factotal
                FROM facfac
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                  AND facnumfac = :facnumfac
                  AND factipo = 'ND'
            """
            )
            cabecera = connection.execute(query_cabecera, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "facnumfac": facnumfac}).mappings().first()

            if not cabecera:
                return jsonify({"success": False, "message": f"La Nota de Débito {facnumfac} no fue encontrada."}), 404

            # ==========================================
            # 2. OBTENER METADATOS (Cliente, Pago, Vendedor)
            # ==========================================
            query_cliente = text(
                """
                SELECT clicodigo, clinombre, cliruc, clitelef1, clidirec
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            """
            )
            cliente = connection.execute(query_cliente, {"ciacodigo": ciacodigo, "clicodigo": cabecera["clicodigo"]}).mappings().first()

            query_formapago = text(
                """
                SELECT fordescri
                FROM cxcbformapag
                WHERE ciacodigo = :ciacodigo AND factippag = :factippag
            """
            )
            formaPago = connection.execute(query_formapago, {"ciacodigo": ciacodigo, "factippag": cabecera["factippag"]}).mappings().first()

            query_vendedor = text(
                """
                SELECT vennombre
                FROM fapvendedor
                WHERE ciacodigo = :ciacodigo AND vencodigo = :vencodigo
            """
            )
            vendedor = connection.execute(query_vendedor, {"ciacodigo": ciacodigo, "vencodigo": cabecera["vencodigo"]}).mappings().first()

            # ==========================================
            # 3. OBTENER MOTIVOS / SERVICIOS (fatfac)
            # ==========================================
            query_detalles = text(
                """
                SELECT
                    t.facsecuen as secuencia,
                    t.sercodigo,
                    COALESCE(s.serdescri, a.artdescri, t.sercodigo) as serdescri,
                    t.faccantidad as cantidad,
                    t.facpreven as precioUnitario,
                    t.facpordesc as descuento,
                    t.faciva as iva,
                    t.facvaltot as total
                FROM fatfac t
                LEFT JOIN cxcbser s ON t.ciacodigo = s.ciacodigo AND t.sercodigo = s.sercodigo
                LEFT JOIN inmart a ON t.ciacodigo = a.ciacodigo AND t.sercodigo = a.artcodigo
                WHERE t.ciacodigo = :ciacodigo
                  AND t.loccodigo = :loccodigo
                  AND t.facnumfac = :facnumfac
                  AND t.factipo = 'ND'
                ORDER BY t.facsecuen
            """
            )
            motivos = connection.execute(query_detalles, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "facnumfac": facnumfac}).mappings().all()

        # ==========================================
        # 4. FORMATEAR RESPUESTA FINAL PARA REACT
        # ==========================================
        cabecera_dict = dict(cabecera)
        cabecera_dict["facfecemi"] = cabecera["facfecemi"].isoformat() if cabecera["facfecemi"] else None
        cabecera_dict["facfecven"] = cabecera["facfecven"].isoformat() if cabecera["facfecven"] else None
        cabecera_dict["facsubtot"] = float(cabecera["facsubtot"] or 0)
        cabecera_dict["faciva"] = float(cabecera["faciva"] or 0)
        cabecera_dict["factotal"] = float(cabecera["factotal"] or 0)

        motivos_list = []
        for m in motivos:
            m_dict = dict(m)
            m_dict["cantidad"] = float(m["cantidad"] or 0)
            m_dict["precioUnitario"] = float(m["precioUnitario"] or 0)
            m_dict["descuento"] = float(m["descuento"] or 0)
            m_dict["iva"] = float(m["iva"] or 0)
            m_dict["total"] = float(m["total"] or 0)
            motivos_list.append(m_dict)

        # Retornamos la estructura exacta que espera result.data.data en el frontend
        return jsonify({"success": True, "data": {"data": {"cabecera": cabecera_dict, "cliente": dict(cliente) if cliente else {}, "formaPago": dict(formaPago) if formaPago else {}, "vendedor": dict(vendedor) if vendedor else {}, "motivos": motivos_list}}})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al reconstruir la Nota de Débito: {str(e)}"}), 500
