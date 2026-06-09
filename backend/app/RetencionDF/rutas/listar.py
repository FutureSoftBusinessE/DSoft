from flask import request, jsonify
from app.RetencionDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/listar", methods=["POST"])
@cross_origin()
@jwt_required()
def listar_retenciones():
    """Obtiene el listado paginado de las Retenciones para la grilla principal"""
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
            FROM cxpcret r
            WHERE r.ciacodigo = :ciacodigo
              AND r.loccodigo = :loccodigo
        """
        params = {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "offset": offset, "limit": page_size}

        if global_filter:
            base_query += " AND (r.retid LIKE :filtro OR r.retnombre LIKE :filtro OR r.retruc LIKE :filtro)"
            params["filtro"] = f"%{global_filter}%"

        sql = f"""
            SELECT
                r.retid, r.retnombre, r.retfecemi, r.retvalfuente, r.retvaliva,
                r.retstatus, r.sriautnumero, r.retusuisys,
                COUNT(*) OVER() AS TotalRows
            {base_query}
            ORDER BY r.retfecemi DESC, r.retid DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        """

        with engine.connect() as connection:
            resultados = connection.execute(text(sql), params).mappings().fetchall()

            data_list = []
            total_rows = 0

            for row in resultados:
                total_rows = row["TotalRows"]
                total_retencion = float(row["retvalfuente"] or 0) + float(row["retvaliva"] or 0)
                data_list.append(
                    {
                        "retid": str(row["retid"]).strip(),
                        "retnombre": str(row["retnombre"]).strip(),
                        "retfecemi": row["retfecemi"].isoformat() if row["retfecemi"] else None,
                        "rettotal": total_retencion,
                        "retstatus": str(row["retstatus"]).strip(),
                        "sriautnumero": str(row["sriautnumero"] or "").strip(),
                        "retusuisys": str(row["retusuisys"]).strip(),
                    }
                )

        return jsonify({"success": True, "data": data_list, "meta": {"totalRowCount": total_rows}, "totalRowCount": total_rows})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error listando retenciones: {str(e)}"}), 500
