from flask import jsonify, request
from app.EjecucionTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime


def campo_existe_en_la_tabla(connection, tabla, campo):

    check_query = """
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = :tabla
        AND COLUMN_NAME = :campo
    """

    check_query_result = connection.execute(text(check_query), {"tabla": tabla, "campo": campo}).scalar() > 0

    return check_query_result


@bp.route("/getSpecificEvent", methods=["POST"])
@cross_origin()
@jwt_required()
def getSpecificEvent():
    """
    Obtiene la estructura correcta de informacion para un evento especifico
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        # Parsear datos JSON del request
        data = request.get_json()
        eventocodigo = data.get("eventocodigo")  # Código del evento

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            with connection.begin():
                # ============================================
                # 1. OBTENER DATOS DEL EVENTO
                # ============================================
                placa_field_exists = campo_existe_en_la_tabla(connection, "gdocmeventos", "placa")
                procesocod_field_exists = campo_existe_en_la_tabla(connection, "gdocmeventos", "procesocod")

                print(placa_field_exists)
                query_evento = f"""
                    SELECT
                        e.eventocodigo,
                        e.pregcodigo,
                        e.pregdescri,
                        e.usrcodigo,
                        e.usrnombre,
                        e.eventofecha,
                        e.eventohorainicio,
                        e.eventohorafin,
                        e.eventoduracion,
                        e.clicodigo,
                        e.clinombre,
                        e.eventostatus,
                        e.porcentajeavance,
                        e.paquetecodigo,
                        e.formsecuen,
                        e.eventorecuren,
                        e.eventorecurennum,
                        e.eventorecurensecuen,
                        e.eventofechabase,
                        e.ciacodigo,
                        e.loccodigo,
                        {'e.placa' if placa_field_exists else 'NULL as placa'},
                        {'e.procesocod' if procesocod_field_exists else 'NULL as procesocod'}
                    FROM gdocmeventos e
                    WHERE e.ciacodigo = :ciacodigo
                        AND e.loccodigo = :loccodigo
                        AND e.eventocodigo = :eventocodigo
                """

                evento_result = connection.execute(text(query_evento), {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "eventocodigo": eventocodigo}).mappings().first()

                if not evento_result:
                    return jsonify({"success": False, "message": "Evento no encontrado"}), 404

                # Convertir el resultado a diccionario
                evento = dict(evento_result)

                # ============================================
                # 2. OBTENER DATOS DE LA TAREA (gdocctareas)
                # ============================================
                pregcodigo = evento["pregcodigo"]

                query_tarea = text(
                    """
                    SELECT
                        pregtipo,
                        pregobligatoria,
                        insticodigo,
                        pregespresencial as esPresencial
                    FROM gdocctareas
                    WHERE ciacodigo = :ciacodigo
                        AND pregcodigo = :pregcodigo
                """
                )

                tarea_result = connection.execute(query_tarea, {"ciacodigo": ciacodigo, "pregcodigo": pregcodigo}).mappings().first()

                tarea = dict(tarea_result) if tarea_result else {}

                # Obtener descripción de la institución si existe insticodigo
                instidescri = None
                if tarea and tarea.get("insticodigo"):
                    query_institucion = text(
                        """
                        SELECT instidescri
                        FROM gdocbinstituciones
                        WHERE insticodigo = :insticodigo
                            AND instistatus = 'A'
                    """
                    )

                    inst_result = connection.execute(query_institucion, {"insticodigo": tarea["insticodigo"]}).mappings().first()

                    if inst_result:
                        instidescri = inst_result["instidescri"]

                # Agregar instidescri a la tarea
                if tarea:
                    tarea["instidescri"] = instidescri
                    # Convertir pregespresencial a boolean
                    tarea["esPresencial"] = bool(tarea.get("esPresencial", 0))

                # ============================================
                # 3. OBTENER OPCIONES DE TAREA (gdocttareas)
                # ============================================
                opciones_tarea = []

                query_opciones = text(
                    """
                    SELECT
                        pregsecuen,
                        pregdescri,
                        pregstatus,
                        pregRespuesta
                    FROM gdocttareas
                    WHERE ciacodigo = :ciacodigo
                        AND pregcodigo = :pregcodigo
                        AND pregtipo = :pregtipo
                    ORDER BY pregsecuen
                """
                )

                pregtipo = tarea.get("pregtipo", "") if tarea else ""

                if pregtipo in ["L", "M"]:  # Solo para Lista y Opciones Múltiples
                    opciones_result = connection.execute(query_opciones, {"ciacodigo": ciacodigo, "pregcodigo": pregcodigo, "pregtipo": pregtipo}).mappings().fetchall()

                    opciones_tarea = [{"pregsecuen": row["pregsecuen"], "pregdescri": row["pregdescri"], "pregRespuesta": row["pregRespuesta"], "pregstatus": row["pregstatus"]} for row in opciones_result]

                # ============================================
                # 4. OBTENER HISTORIAL DE EJECUCIONES (gdocteventos)
                # ============================================
                historial_ejecuciones = []

                query_historial = text(
                    """
                    SELECT
                        eventosecuen,
                        comentario,
                        statusAnterior,
                        statusNuevo,
                        porcentajeavance,
                        respuestaTextoLibre,
                        respuestaListaSecuencia,
                        respuestaMultipleSecuencias,
                        ejecucionFueraRango,
                        tipoFueraRango,
                        fechaEjecucionReal,
                        eventousuisys as tranusuisys,
                        eventofecisys as tranfecisys,
                        eventohorisys as tranhorcisys
                    FROM gdocteventos
                    WHERE ciacodigo = :ciacodigo
                        AND loccodigo = :loccodigo
                        AND eventocodigo = :eventocodigo
                    ORDER BY eventosecuen ASC
                """
                )

                historial_result = connection.execute(query_historial, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "eventocodigo": eventocodigo}).mappings().fetchall()

                # ============================================
                # 4.1 PROCESAR HISTORIAL CON porcentajeAnterior
                # ============================================
                historial_raw_data = []
                for row in historial_result:
                    row_dict = dict(row)

                    # Convertir ejecucionFueraRango de -1/0 a boolean (True/False)
                    ejecucion_fuera_rango_db = row_dict.get("ejecucionFueraRango", 0)
                    ejecucion_fuera_rango = ejecucion_fuera_rango_db == -1

                    # Convertir respuestaMultipleSecuencias de string a array
                    respuesta_multiple = row_dict.get("respuestaMultipleSecuencias")
                    respuesta_multiple_array = []
                    if respuesta_multiple and isinstance(respuesta_multiple, str) and respuesta_multiple.strip():
                        try:
                            respuesta_multiple_array = [int(x.strip()) for x in respuesta_multiple.split(",") if x.strip()]
                        except ValueError:
                            respuesta_multiple_array = []

                    historial_raw_data.append(
                        {
                            "eventosecuen": row_dict["eventosecuen"],
                            "comentario": row_dict["comentario"],
                            "statusAnterior": row_dict["statusAnterior"],
                            "statusNuevo": row_dict["statusNuevo"],
                            "porcentajeavance": row_dict["porcentajeavance"],
                            "respuestaTextoLibre": row_dict.get("respuestaTextoLibre"),
                            "respuestaListaSecuencia": row_dict.get("respuestaListaSecuencia"),
                            "respuestaMultipleSecuencias": respuesta_multiple_array,
                            "ejecucionFueraRango": ejecucion_fuera_rango,
                            "tipoFueraRango": row_dict.get("tipoFueraRango"),
                            "fechaEjecucionReal": row_dict.get("fechaEjecucionReal"),
                            "tranusuisys": row_dict.get("tranusuisys"),
                            "tranfecisys": row_dict.get("tranfecisys"),
                            "tranhorcisys": row_dict.get("tranhorcisys"),
                        }
                    )

                # Calcular porcentajeAnterior para cada registro
                for i, item in enumerate(historial_raw_data):
                    if i == 0:
                        # Para la primera ejecución en el historial
                        porcentaje_anterior = 0
                    else:
                        # Para ejecuciones siguientes
                        porcentaje_anterior = historial_raw_data[i - 1]["porcentajeavance"]

                    historial_ejecuciones.append(
                        {
                            **item,
                            "porcentajeAnterior": porcentaje_anterior,
                            # Formatear fechas
                            "fechaEjecucionReal": item["fechaEjecucionReal"].isoformat() if item["fechaEjecucionReal"] else None,
                            "tranfecisys": item["tranfecisys"].isoformat() if item["tranfecisys"] else None,
                            "tranhorcisys": item["tranhorcisys"].isoformat() if item["tranhorcisys"] else None,
                        }
                    )
                # ============================================
                # 5. OBTENER RESPUESTAS ACTUALES (del último registro del historial)
                # ============================================
                respuesta_texto_libre = None
                respuesta_lista_secuencia = None
                respuesta_multiple_secuencias = []

                if historial_ejecuciones:
                    # Tomar las respuestas del último registro del historial
                    ultimo_historial = historial_ejecuciones[-1]
                    respuesta_texto_libre = ultimo_historial.get("respuestaTextoLibre")
                    respuesta_lista_secuencia = ultimo_historial.get("respuestaListaSecuencia")
                    respuesta_multiple_secuencias = ultimo_historial.get("respuestaMultipleSecuencias", [])

                # ============================================
                # 6. CONSTRUIR RESPUESTA EN EL FORMATO ESPERADO
                # ============================================
                response_data = {
                    "evento": {
                        "ciacodigo": evento["ciacodigo"],
                        "loccodigo": evento["loccodigo"],
                        "eventocodigo": evento["eventocodigo"],
                        "pregcodigo": evento["pregcodigo"],
                        "pregdescri": evento["pregdescri"],
                        "usrcodigo": evento["usrcodigo"],
                        "usrnombre": evento["usrnombre"],
                        "eventofecha": evento["eventofecha"].strftime("%Y-%m-%d") if evento["eventofecha"] else None,
                        "eventohorainicio": evento["eventohorainicio"].isoformat() if evento["eventohorainicio"] else None,
                        "eventohorafin": evento["eventohorafin"].isoformat() if evento["eventohorafin"] else None,
                        "eventoduracion": evento["eventoduracion"],
                        "clicodigo": evento["clicodigo"],
                        "clinombre": evento["clinombre"],
                        "eventostatus": evento["eventostatus"],
                        "porcentajeavance": evento["porcentajeavance"] if evento["porcentajeavance"] is not None else 0,
                        "paquetecodigo": evento["paquetecodigo"],
                        "formsecuen": evento["formsecuen"],
                        "eventorecuren": evento["eventorecuren"],
                        "eventorecurennum": evento["eventorecurennum"],
                        "eventorecurensecuen": evento["eventorecurensecuen"],
                        "eventofechabase": evento["eventofechabase"].isoformat() if evento["eventofechabase"] else None,
                        "placa": evento.get("placa", ""),
                        "procesocod": evento.get("procesocod", ""),
                    },
                    "tarea": {"pregtipo": tarea.get("pregtipo", ""), "pregobligatoria": bool(tarea.get("pregobligatoria", 0)), "insticodigo": tarea.get("insticodigo"), "instidescri": tarea.get("instidescri"), "esPresencial": tarea.get("esPresencial", False)},  # Convertido a boolean
                    "opcionesTarea": opciones_tarea,
                    "historialEjecuciones": historial_ejecuciones,
                    "respuestaTextoLibre": respuesta_texto_libre,
                    "respuestaListaSecuencia": respuesta_lista_secuencia,
                    "respuestaMultipleSecuencias": respuesta_multiple_secuencias,
                }

                return jsonify({"success": True, "message": "Evento obtenido exitosamente", "data": response_data}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error al obtener evento: {str(e)}"}), 500
