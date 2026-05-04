from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/deleteEventosPlanificados", methods=["POST"])
@cross_origin()
@jwt_required()
def deleteEventosPlanificados():
    """
    Elimina eventos planificados, (en el sistema solo se puede eliminar eventos en estado PENDIENTE)
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        # Parsear datos JSON del request
        data = request.get_json()
        eventos_a_eliminar = data.get("eventos")

        # Validar datos requeridos

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            with connection.begin():
                for evento in eventos_a_eliminar:
                    query_delete_evento = text(
                        """
                            DELETE FROM gdocmeventos
                            WHERE ciacodigo = :ciacodigo
                            AND loccodigo = :loccodigo
                            AND eventocodigo = :eventocodigo
                            AND eventostatus = 'PENDIENTE'
                        """
                    )

                    connection.execute(query_delete_evento, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "eventocodigo": evento.get("id")})

        return jsonify({"success": True, "message": "Eventos eliminados exitosamente", "data": {"data": eventos_a_eliminar}}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": {"success": False, "message": f"Error al guardar ejecución: {str(e)}"}}), 500
