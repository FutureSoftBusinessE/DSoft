from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.AsignacionDeClientesAUsu import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de encriptación
from services.encrip_desencrip import encriptar


@bp.route("/getClientesAsignados", methods=["POST"])
@jwt_required()
@api_endpoint
def getClientesAsignados():
    # 1. Extracción de variables de sesión[cite: 6]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener parámetros de la solicitud[cite: 6]
    data = request.get_json()
    usrcodigo_select = data.get("usrcodigo")

    # Si no se envía un usuario válido, retornamos una lista vacía para no romper el frontend[cite: 6]
    if not usrcodigo_select:
        return {"data": []}

    # Encriptamos el código del usuario para hacer match en la base de datos
    usrcodigo_encriptado = encriptar(str(usrcodigo_select).strip())

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 3. Consulta SQL con INNER JOIN[cite: 6]
        # Buscamos la relación en el Nivel 1 (gdoc_usuariocliente) cruzada con el maestro de clientes[cite: 6]
        sql = text(
            """
            SELECT
                c.clicodigo,
                c.cliruc,
                c.clinombre,
                uc.hereda_documentos
            FROM gdoc_usuariocliente uc
            INNER JOIN cxcmcli c
                ON uc.ciacodigo = c.ciacodigo AND uc.clientecodigo = c.clicodigo
            WHERE uc.ciacodigo = :cia
              AND uc.usrcodigo = :usrcodigo
              AND c.clistatus = 'A'
            ORDER BY c.clinombre ASC
            """
        )

        result = connection.execute(sql, {"cia": sCodCia, "usrcodigo": usrcodigo_encriptado}).mappings().all()

        lista_asignados = []
        for r in result:
            lista_asignados.append(
                {
                    "clicodigo": r["clicodigo"],
                    "cliruc": r["cliruc"] if r["cliruc"] else "",
                    "clinombre": r["clinombre"] if r["clinombre"] else "",
                    # Transformación segura del bit de SQL Server a Booleano de Python para el frontend[cite: 6]
                    "hereda_documentos": bool(r["hereda_documentos"]) if r["hereda_documentos"] is not None else False,
                }
            )

    return {"data": lista_asignados}
