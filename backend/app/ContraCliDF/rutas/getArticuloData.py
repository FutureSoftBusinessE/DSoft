from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.ContraCliDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/getArticuloDataDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def getArticuloDataDF():
    # 1. Extracción de sesión y contexto
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]

    # 2. Extracción de parámetros enviados por React
    data = request.get_json()
    artcodigo = str(data.get("artcodigo", "")).strip().upper()
    invcodigo = str(data.get("invcodigo", "")).strip().upper()  # Opcional, dependiendo de si el usuario eligió inventario

    if not artcodigo:
        raise ValidationError("Debe proporcionar un código de artículo válido.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 3. Construcción de la consulta aplicando reglas de VB6
        # Buscamos que sea activo ('A'), producto para venta (<> 0) y que sea servicio (<> 0)
        sql_base = """
            SELECT TOP 1
                invcodigo,
                artcodigo,
                artdescri,
                artprecventa1 AS precio1
            FROM inmart
            WHERE ciacodigo = :cia
              AND artcodigo = :artcodigo
              AND artstatus = 'A'
              AND artprodven <> 0
              AND artservicio <> 0
        """
        params = {"cia": sCodCia, "artcodigo": artcodigo}

        # Si el frontend envía el código de inventario, refinamos la búsqueda
        if invcodigo:
            sql_base += " AND invcodigo = :invcodigo"
            params["invcodigo"] = invcodigo

        # 4. Ejecución
        result = connection.execute(text(sql_base), params).mappings().fetchone()

        if not result:
            raise ValidationError(f"El código '{artcodigo}' no existe, no está activo, o no está clasificado como un Servicio apto para venta.")

        # 5. Formateo de respuesta
        articulo_data = {
            "invcodigo": result["invcodigo"],
            "artcodigo": result["artcodigo"],
            "artdescri": result["artdescri"],
            "precio1": float(result["precio1"] or 0.0)
        }

    return {"data": articulo_data}
