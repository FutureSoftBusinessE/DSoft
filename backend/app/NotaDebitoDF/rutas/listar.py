from flask import request, jsonify
from app.NotaDebitoDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session


@bp.route("/listar", methods=["POST"])
@cross_origin()
@jwt_required()
# ELIMINAMOS @api_endpoint PARA EVITAR LA ESTRUCTURA "data.data" Y LOS NaN
def listar_notas_debito():
    """Obtiene el listado paginado de las Notas de Débito para la grilla principal"""
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
            FROM facfac f
            INNER JOIN cxcmcli c
                ON f.ciacodigo = c.ciacodigo AND f.clicodigo = c.clicodigo
            WHERE f.ciacodigo = :ciacodigo
              AND f.loccodigo = :loccodigo
              AND f.factipo = 'ND'
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
                  f.facnumfac LIKE :busqueda OR
                  f.facnumref LIKE :busqueda OR
                  c.clinombre LIKE :busqueda OR
                  c.cliruc LIKE :busqueda OR
                  f.sriautnumero LIKE :busqueda
              )
            """
            params["busqueda"] = f"%{global_filter}%"

        sql = f"""
            SELECT
                f.facnumfac,
                f.facnumref,
                c.clinombre,
                f.facfecemi,
                f.factotal,
                f.facstatus,
                f.sriautnumero,
                f.facusuisys,
                COUNT(*) OVER() as TotalRows
            {base_query}
            ORDER BY f.facfecemi DESC, f.facnumfac DESC
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
                        "facnumfac": row["facnumfac"].strip() if row["facnumfac"] else "",
                        "facnumref": row["facnumref"].strip() if row["facnumref"] else "",
                        "clinombre": row["clinombre"].strip() if row["clinombre"] else "",
                        # Mantenemos el formato ISO para evitar el error "Invalid Date" en React
                        "facfecemi": row["facfecemi"].isoformat() if row["facfecemi"] else None,
                        "factotal": float(row["factotal"] or 0),
                        "facstatus": row["facstatus"].strip() if row["facstatus"] else "",
                        "sriautnumero": row["sriautnumero"].strip() if row["sriautnumero"] else "",
                        "facusuisys": row["facusuisys"].strip() if row["facusuisys"] else "",
                    }
                )

        # =========================================================================
        # JSON PLANO: Estructura exacta que requiere el wrapper para funcionar
        # =========================================================================
        return jsonify({"success": True, "data": data_list, "meta": {"totalRowCount": total_rows}, "totalRowCount": total_rows})  # La tabla leerá el arreglo directamente de aquí  # El paginador leerá el total directamente de aquí

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al listar: {str(e)}"}), 500
