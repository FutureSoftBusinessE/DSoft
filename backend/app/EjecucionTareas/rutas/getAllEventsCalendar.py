from flask import jsonify, request
from app.EjecucionTareas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar, desencriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime


@bp.route("/getAllEventsCalendar", methods=["GET"])
@jwt_required()
def getAllEventsCalendar():
    """
    Obtiene todos los eventos para el calendario combinando fecha y hora correctamente
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usrcodigo = claims["user"]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        print(usrcodigo)
        with engine.connect() as connection:
            with connection.begin():

                all_usrcodigos = []

                # Verificar que el usuario es administrador de local, si lo es entonces traera todos los usuarios
                is_gerente_flag = False
                is_gerente_query = """
                SELECT
                    usrcodigo, usrflagger
                FROM
                    siactloc
                WHERE
                    usrcodigo = :usrcodigo
                    AND ciacodigo = :ciacodigo
                    AND loccodigo = :loccodigo
                """
                is_gerente_result = connection.execute(text(is_gerente_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "usrcodigo": encriptar(usrcodigo)}).mappings().fetchone()

                if is_gerente_result:
                    is_gerente_result = dict(is_gerente_result)
                    if is_gerente_result["usrflagger"] != 0:
                        is_gerente_flag = True

                # Si el usuario NO es gerente
                if not is_gerente_flag:
                    query_allusr = """
                        SELECT usrcodigo
                        FROM siaccusr
                        WHERE usrcodigoreporta = :usrcodigo
                    """
                    result_allusr = connection.execute(text(query_allusr), {"usrcodigo": usrcodigo}).mappings().fetchall()

                    # Obtener todos los usrcodigo de los resultados y desencriptarlos
                    all_usrcodigos = [desencriptar(str(row["usrcodigo"])) for row in result_allusr]

                all_usrcodigos.append(usrcodigo)

                query = """
                        SELECT
                            gdocmeventos.eventocodigo as id,
                            gdocmeventos.pregdescri as title,
                            gdocmeventos.eventofecha,
                            gdocmeventos.eventohorainicio,
                            gdocmeventos.eventohorafin,
                            gdocmeventos.eventostatus as status,
                            gdocmeventos.clicodigo,
                            gdocmeventos.clinombre,
                            gdocmeventos.usrcodigo,
                            gdocmeventos.usrnombre,
                            gdocmeventos.eventoduracion,
                            gdocmeventos.eventorecuren,
                            gdocmeventos.eventorecurennum,
                            gdocmeventos.eventorecurensecuen,
                            gdocmeventos.porcentajeavance,
                            gdocmeventos.paquetecodigo,
                            gdocmeventos.pregcodigo,
                            gdocmeventos.formsecuen,
                            cgblocal.locdescri
                        FROM gdocmeventos
                        INNER JOIN cgblocal
                            ON cgblocal.ciacodigo = :ciacodigo
                            AND cgblocal.loccodigo = :loccodigo
                        WHERE gdocmeventos.ciacodigo = :ciacodigo
                            AND gdocmeventos.loccodigo = :loccodigo
                    """

                # Agregar la condición 'IN :all_usrcodigos' solo si el usuario NO es gerente
                if not is_gerente_flag:
                    query += " AND gdocmeventos.usrcodigo IN :all_usrcodigos"

                # Finalizar la consulta con el ordenamiento
                query += """
                    ORDER BY gdocmeventos.eventofecha, gdocmeventos.eventohorainicio
                """

                result = connection.execute(text(query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "all_usrcodigos": tuple(all_usrcodigos)}).mappings().fetchall()

                eventos = []

                for row in result:
                    background_color, text_color = determinar_colores_por_estado(row["status"])

                    # Combinar fecha con hora usando datetime.combine (como en tu ejemplo)
                    try:
                        # Extraer solo la parte de tiempo
                        if row["eventohorainicio"]:
                            # Si eventohorainicio es datetime, extraer solo el tiempo
                            if isinstance(row["eventohorainicio"], datetime):
                                hora_inicio = row["eventohorainicio"].time()
                            else:
                                hora_inicio = row["eventohorainicio"]

                        if row["eventohorafin"]:
                            # Si eventohorafin es datetime, extraer solo el tiempo
                            if isinstance(row["eventohorafin"], datetime):
                                hora_fin = row["eventohorafin"].time()
                            else:
                                hora_fin = row["eventohorafin"]

                        # Crear datetime combinado
                        start_dt = datetime.combine(row["eventofecha"].date(), hora_inicio)
                        end_dt = datetime.combine(row["eventofecha"].date(), hora_fin)

                        start_iso = start_dt.isoformat()
                        end_iso = end_dt.isoformat()

                    except Exception as e:
                        print(f"Error combinando fecha/hora para evento {row['id']}: {str(e)}")
                        # Fallback: usar solo la fecha
                        start_iso = row["eventofecha"].isoformat()
                        end_iso = row["eventofecha"].isoformat()

                    # Crear título con información relevante
                    title = f"{row['title']}"
                    if row["clinombre"] and row["clinombre"] != "CLIENTE FINAL":
                        title += f" - {row['clinombre']}"

                    evento = {
                        "id": row["id"],
                        "title": title,
                        "start": start_iso,
                        "end": end_iso,
                        "backgroundColor": background_color,
                        "textColor": text_color,
                        "extendedProps": {
                            "locdescri": row["locdescri"],
                            # Campos principales
                            "status": row["status"],
                            "clinombre": row["clinombre"],
                            "usrnombre": row["usrnombre"],
                            "duracion": row["eventoduracion"],
                            "avance": row["porcentajeavance"] or 0,
                            "clicodigo": row["clicodigo"],
                            "usrcodigo": row["usrcodigo"],
                            # Campos para compatibilidad
                            "cliente": row["clinombre"],
                            "usuario": row["usrnombre"],
                            "tareaDescripcion": row["title"],
                            "clienteId": row["clicodigo"],
                            "usuarioNombre": row["usrnombre"],
                            "clienteNombre": row["clinombre"],
                            # Para el modal de detalles
                            "esRecurrente": bool(row["eventorecuren"]),
                            "recurrencia": row["eventorecuren"],
                            "numRepeticionSecuen": row["eventorecurensecuen"],
                            "numTotalRepeticiones": row["eventorecurennum"],
                            "paqueteDescripcion": f"Paquete {row['paquetecodigo']}" if row["paquetecodigo"] else None,
                            "pregcodigo": row["pregcodigo"],
                            "formsecuen": row["formsecuen"],
                            # Campos originales para debugging
                            "eventofecha": row["eventofecha"].isoformat() if row["eventofecha"] else None,
                            "eventohorainicio": row["eventohorainicio"].isoformat() if row["eventohorainicio"] else None,
                            "eventohorafin": row["eventohorafin"].isoformat() if row["eventohorafin"] else None,
                        },
                    }
                    eventos.append(evento)

                return jsonify({"success": True, "message": "Eventos obtenidos exitosamente", "data": eventos, "total": len(eventos)}), 200

    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": f"Error al obtener eventos: {str(e)}"}), 500


def determinar_colores_por_estado(estado):
    """
    Determina los colores de fondo y texto basados en el estado del evento
    """
    colores = {
        "PENDIENTE": ("#ffeb3b", "#000000"),  # Amarillo, texto negro
        "EN_PROCESO": ("#2196f3", "#ffffff"),  # Azul, texto blanco
        "COMPLETADA": ("#4caf50", "#ffffff"),  # Verde, texto blanco
        "REPROGRAMADA": ("#ff9800", "#000000"),  # Naranja, texto negro
        "CANCELADA": ("#f44336", "#ffffff"),  # Rojo, texto blanco
    }

    # Asegurarse de que el estado esté en mayúsculas
    estado_upper = estado.upper() if estado else "PENDIENTE"
    return colores.get(estado_upper, ("#757575", "#ffffff"))
