from flask import request, jsonify
from app.GuiadeRemisionDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/buscarFacturaGR", methods=["POST"])
@jwt_required()
def buscarFacturaGR():
    """Busca facturas autorizadas para enlazarlas a una Guía de Remisión"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        payload = request.get_json() or {}
        busqueda = payload.get("busqueda", payload.get("globalFilter", "")).strip()

        if not busqueda and payload.get("facnumfac"):
            busqueda = payload.get("facnumfac").strip()

        page_index = int(payload.get("pageIndex", 0))
        page_size = int(payload.get("pageSize", 10))
        offset = page_index * page_size

        # Buscamos facturas ('FE' o 'FA')
        base_query = """
            FROM facfac f
            INNER JOIN cxcmcli c ON f.ciacodigo = c.ciacodigo AND f.clicodigo = c.clicodigo
            WHERE f.ciacodigo = :ciacodigo
              AND f.loccodigo = :loccodigo
              AND f.factipo IN ('FE', 'FA')
        """

        params = {
            "ciacodigo": ciacodigo,
            "loccodigo": loccodigo,
            "offset": offset,
            "limit": page_size,
        }

        if busqueda:
            base_query += """
              AND (f.facnumfac LIKE :busqueda
                   OR c.cliruc LIKE :busqueda
                   OR c.clinombre LIKE :busqueda)
            """
            params["busqueda"] = f"%{busqueda}%"

        sql = f"""
            SELECT
                f.facnumfac, f.facfecemi, f.factotal,
                f.clicodigo, c.clinombre, c.cliruc, c.clidirec, c.clitelef1, f.sriautnumero,
                COUNT(*) OVER() as TotalRows
            {base_query}
            ORDER BY f.facfecemi DESC, f.facnumfac DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        """

        with engine.connect() as connection:
            resultados = connection.execute(text(sql), params).mappings().fetchall()

            facturas = []
            total_rows = 0

            for row in resultados:
                total_rows = row["TotalRows"]
                facturas.append(
                    {
                        "facnumfac": row["facnumfac"].strip() if row["facnumfac"] else "",
                        "facfecemi": row["facfecemi"].strftime("%d/%m/%Y") if row["facfecemi"] else "",
                        "factotal": float(row["factotal"] or 0),
                        "clicodigo": row["clicodigo"].strip() if row["clicodigo"] else "",
                        "clinombre": row["clinombre"].strip() if row["clinombre"] else "",
                        "cliruc": row["cliruc"].strip() if row["cliruc"] else "",
                        "clidirec": row["clidirec"].strip() if row["clidirec"] else "",
                        "clitelef1": row["clitelef1"].strip() if row["clitelef1"] else "",
                        "sriautnumero": row["sriautnumero"].strip() if row["sriautnumero"] else "",
                    }
                )

        return jsonify({"success": True, "data": facturas, "meta": {"totalRowCount": total_rows}, "totalRowCount": total_rows})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al cargar facturas: {str(e)}"}), 500
