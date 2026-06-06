from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime


@bp.route("/getTareasAReprogramar", methods=["GET"])
@jwt_required()
def getTareasAReprogramar():
    """
    Retorna todos los eventos en estado REPROGRAMADA
    que pueden ser importados para crear nuevas versiones
    """
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["seleccion"].get("loccodigo", "01")

        db.session = get_session(claims["seleccion"]["clicianonBD"])
        engine = db.session.bind

        with engine.connect() as connection:
            query = text(
                """
                SELECT
                    -- Identificación del evento
                    e.eventocodigo,

                    -- Información de la tarea
                    e.pregcodigo,
                    e.pregdescri,

                    -- Información del usuario asignado originalmente
                    e.usrcodigo,
                    e.usrnombre,

                    -- Información del cliente
                    e.clicodigo,
                    e.clinombre,

                    -- Fecha y horario original
                    e.eventofecha,
                    e.eventohorainicio,
                    e.eventohorafin,
                    e.eventoduracion,

                    -- Información de recurrencia original (si tenía)
                    e.eventorecuren,
                    e.eventorecurensecuen,
                    e.eventorecurennum,
                    e.eventofechabase,

                    -- Estado actual (siempre será REPROGRAMADA)
                    e.eventostatus,

                    -- Porcentaje de avance original
                    e.porcentajeavance,

                    -- Información de paquete (si venía de uno)
                    e.paquetecodigo,
                    e.formsecuen,

                    -- Campos de auditoría (opcional, para referencia)
                    e.eventofecisys,
                    e.eventousuisys

                FROM gdocmeventos e
                WHERE e.ciacodigo = :ciacodigo
                    AND e.loccodigo = :loccodigo
                    AND e.eventostatus = 'REPROGRAMADA'
                    AND (referenciaeventocodigoreprogramado IS NULL OR  referenciaeventocodigoreprogramado = '')

                ORDER BY e.eventofecha DESC, e.eventocodigo DESC
            """
            )

            resultados = connection.execute(query, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).fetchall()

            # Convertir a lista de diccionarios
            eventos = []
            for row in resultados:
                evento_dict = {
                    "value": row.pregcodigo,
                    "label": f"{row.pregdescri} ({row.eventocodigo})",
                    # Identificación
                    "eventocodigo": row.eventocodigo,
                    # Tarea
                    "pregcodigo": row.pregcodigo,
                    "pregdescri": row.pregdescri,
                    "pregdurmin": row.eventoduracion,  # IMPORTANTE: para frontend
                    # Usuario original
                    "usrcodigo": row.usrcodigo,
                    "usrnombre": row.usrnombre,
                    # Cliente
                    "clicodigo": row.clicodigo,
                    "clinombre": row.clinombre,
                    # Fecha y horario
                    "eventofecha": row.eventofecha.isoformat() if row.eventofecha else None,
                    "eventohorainicio": row.eventohorainicio.isoformat() if row.eventohorainicio else None,
                    "eventohorafin": row.eventohorafin.isoformat() if row.eventohorafin else None,
                    "eventoduracion": row.eventoduracion,
                    # Recurrencia original
                    "eventorecuren": row.eventorecuren,
                    "eventorecurensecuen": row.eventorecurensecuen,
                    "eventorecurennum": row.eventorecurennum,
                    "eventofechabase": row.eventofechabase.isoformat() if row.eventofechabase else None,
                    # Estado
                    "eventostatus": row.eventostatus,
                    # Avance
                    "porcentajeavance": row.porcentajeavance,
                    # Paquete
                    "paquetecodigo": row.paquetecodigo,
                    "formsecuen": row.formsecuen,
                    # Para el frontend (formateado para display)
                    "fecha_formateada": row.eventofecha.strftime("%d/%m/%Y") if row.eventofecha else "",
                    "horario_formateado": f"{row.eventohorainicio.strftime('%H:%M') if row.eventohorainicio else ''} - {row.eventohorafin.strftime('%H:%M') if row.eventohorafin else ''}",
                }
                eventos.append(evento_dict)

            return jsonify({"success": True, "message": f"Se encontraron {len(eventos)} eventos reprogramados", "data": eventos}), 200

    except Exception as e:
        print(f"Error en getTareasAReprogramar: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener eventos reprogramados: {str(e)}", "data": []}), 500
