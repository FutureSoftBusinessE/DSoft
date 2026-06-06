from flask import request, jsonify
from app.GuiadeRemisionDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/listar", methods=["POST"])
@jwt_required()
def listar_guias():
    """Obtiene el listado paginado de Guías de Remisión (IncGuia cruzado con inbtranspor)"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        payload = request.get_json() or {}
        page_index = int(payload.get("pageIndex", 0))
        page_size = int(payload.get("pageSize", 10))
        global_filter = payload.get("globalFilter", "").strip()

        offset = page_index * page_size

        base_query = """
            FROM IncGuia g
            LEFT JOIN inbtranspor t ON g.ciacodigo = t.ciacodigo AND g.transcodigo = t.transcodigo
            WHERE g.ciacodigo = :ciacodigo
              AND g.loccodigo = :loccodigo
        """

        params = {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "offset": offset, "limit": page_size}

        if global_filter:
            base_query += """
              AND (
                  g.guinumero LIKE :busqueda OR
                  g.facnumfac LIKE :busqueda OR
                  g.clinombre LIKE :busqueda OR
                  t.transdescri LIKE :busqueda OR
                  g.sriautnumero LIKE :busqueda
              )
            """
            params["busqueda"] = f"%{global_filter}%"

        sql = f"""
            SELECT
                g.guinumero, g.facnumfac, g.clinombre, g.guifecha, g.guifecfintrans,
                t.transdescri as transportista, g.guistatus, g.sriautnumero, g.guiusuisys,
                COUNT(*) OVER() as TotalRows
            {base_query}
            ORDER BY g.guifecha DESC, g.guinumero DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        """

        with engine.connect() as connection:
            resultados = connection.execute(text(sql), params).mappings().fetchall()
            data_list = []
            total_rows = 0

            for row in resultados:
                total_rows = row["TotalRows"]
                data_list.append(
                    {
                        "guinumero": row["guinumero"].strip() if row["guinumero"] else "",
                        "facnumfac": row["facnumfac"].strip() if row["facnumfac"] else "",
                        "clinombre": row["clinombre"].strip() if row["clinombre"] else "",
                        "guifecha": row["guifecha"].isoformat() if row["guifecha"] else None,
                        "guifecfintrans": row["guifecfintrans"].isoformat() if row["guifecfintrans"] else None,
                        "transportista": row["transportista"].strip() if row["transportista"] else "",
                        "guistatus": row["guistatus"].strip() if row["guistatus"] else "",
                        "sriautnumero": row["sriautnumero"].strip() if row["sriautnumero"] else "",
                        "guiusuisys": row["guiusuisys"].strip() if row["guiusuisys"] else "",
                    }
                )

        return jsonify({"success": True, "data": data_list, "meta": {"totalRowCount": total_rows}, "totalRowCount": total_rows})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al listar: {str(e)}"}), 500
