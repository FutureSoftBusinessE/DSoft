from flask import request, jsonify
from app.NotaCreditoDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/listar", methods=["POST"])
@cross_origin()
@jwt_required()
def listar_notas_credito():
    """Obtiene el listado paginado de las Notas de Crédito para la grilla principal"""
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
            FROM cxccnc n
            INNER JOIN cxcmcli c
                ON n.ciacodigo = c.ciacodigo AND n.clicodigo = c.clicodigo
            WHERE n.ciacodigo = :ciacodigo
              AND n.loccodigo = :loccodigo
        """

        params = {
            "ciacodigo": ciacodigo,
            "loccodigo": loccodigo,
            "offset": offset,
            "limit": page_size,
        }

        if global_filter:
            base_query += """
              AND (
                  n.nccodigo LIKE :busqueda OR
                  n.facnumfac LIKE :busqueda OR
                  c.clinombre LIKE :busqueda OR
                  c.cliruc LIKE :busqueda OR
                  n.sriautnumero LIKE :busqueda
              )
            """
            params["busqueda"] = f"%{global_filter}%"

        sql = f"""
            SELECT
                n.nccodigo,
                n.facnumfac,
                c.clinombre,
                n.ncfecemi,
                (n.ncsubtot + n.nctotiva) as factotal,
                n.ncstatus,
                n.sriautnumero,
                n.ncusuisys,
                COUNT(*) OVER() as TotalRows
            {base_query}
            ORDER BY n.ncfecemi DESC, n.nccodigo DESC
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
                        "nccodigo": row["nccodigo"].strip() if row["nccodigo"] else "",
                        "facnumfac": row["facnumfac"].strip() if row["facnumfac"] else "",
                        "clinombre": row["clinombre"].strip() if row["clinombre"] else "",
                        "ncfecemi": row["ncfecemi"].isoformat() if row["ncfecemi"] else None,
                        "factotal": float(row["factotal"] or 0),
                        "ncstatus": row["ncstatus"].strip() if row["ncstatus"] else "",
                        "sriautnumero": row["sriautnumero"].strip() if row["sriautnumero"] else "",
                        "ncusuisys": row["ncusuisys"].strip() if row["ncusuisys"] else "",
                    }
                )

        return jsonify({"success": True, "data": data_list, "meta": {"totalRowCount": total_rows}, "totalRowCount": total_rows})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al listar Notas de Crédito: {str(e)}"}), 500
