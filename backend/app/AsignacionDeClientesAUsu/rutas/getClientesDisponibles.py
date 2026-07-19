from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.AsignacionDeClientesAUsu import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de encriptación
from services.encrip_desencrip import encriptar


@bp.route("/getClientesDisponibles", methods=["POST"])
@jwt_required()
@api_endpoint
def getClientesDisponibles():
    # 1. Extracción de sesión
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Parámetros del frontend
    data = request.get_json()
    usrcodigo_select = data.get("usrcodigo")
    search_term = str(data.get("search", "")).strip().upper()
    page = int(data.get("page", 1))
    per_page = 50  # Paginación estricta para virtualización de frontend

    # Si no hay usuario seleccionado, devolvemos vacío para no saturar
    if not usrcodigo_select:
        return {"data": [], "total": 0}

    # Encriptamos el código del usuario para hacer match en la base de datos
    usrcodigo_encriptado = encriptar(str(usrcodigo_select).strip())

    offset = (page - 1) * per_page

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 3. Consulta Base (Optimizado para usar índices compuestos)
        sql_base = """
            FROM cxcmcli c
            WHERE c.ciacodigo = :cia
              AND c.clistatus = 'A'
              AND NOT EXISTS (
                  SELECT 1 FROM gdoc_usuariocliente uc
                  WHERE uc.ciacodigo = c.ciacodigo
                    AND uc.clientecodigo = c.clicodigo
                    AND uc.usrcodigo = :usrcodigo
              )
        """
        # Inyectamos la variable encriptada en los parámetros de la consulta
        params = {"cia": sCodCia, "usrcodigo": usrcodigo_encriptado}

        # 4. Filtro dinámico de Búsqueda
        if search_term:
            sql_base += " AND (c.clicodigo LIKE :busqueda OR c.cliruc LIKE :busqueda OR c.clinombre LIKE :busqueda) "
            params["busqueda"] = f"{search_term}%"

        # 5. Obtener Total de Registros (Para el scroll virtual)
        sql_count = text(f"SELECT COUNT(*) as total {sql_base}")
        total_records = connection.execute(sql_count, params).scalar()

        # 6. Obtener Registros Paginados
        sql_data = text(
            f"""
            SELECT c.clicodigo, c.cliruc, c.clinombre
            {sql_base}
            ORDER BY c.clicodigo ASC
            OFFSET :offset ROWS FETCH NEXT :per_page ROWS ONLY
            """
        )
        params["offset"] = offset
        params["per_page"] = per_page

        result = connection.execute(sql_data, params).mappings().all()

        lista_clientes = []
        for r in result:
            lista_clientes.append(
                {
                    "clicodigo": r["clicodigo"],
                    "cliruc": r["cliruc"] if r["cliruc"] else "",
                    "clinombre": r["clinombre"] if r["clinombre"] else "",
                }
            )

    return {
        "data": lista_clientes,
        "total": total_records,
        "page": page,
        "per_page": per_page,
    }
