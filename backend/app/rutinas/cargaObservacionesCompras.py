from sqlalchemy import text
from services.encrip_desencrip import encriptar, desencriptar


def cargaObservacionesCompras(connection, ciacodigo, codigo, tipo="OC", importacion=None):
    try:
        # Validar parámetros requeridos
        if not codigo:
            raise ValueError("Parámetro 'codigo' es requerido")  # Lanza excepción

        # Construir consulta base
        base_query = """
            SELECT
                ciacodigo, cocid, staid, impcodimportacion, stastatus,
                staaccion, staobserva, stafecisys, stahorisys,
                stausuisys, staestisys, secmod, 'OC' AS tipo
            FROM cxptstatusoc
            WHERE ciacodigo = :ciacodigo AND cocid = :codigo
        """
        params = {"ciacodigo": ciacodigo, "codigo": codigo}

        # Agregar unión para importación si existe
        if importacion:
            base_query += """
                UNION
                SELECT
                    ciacodigo, cocid, staid, impcodimportacion, stastatus,
                    staaccion, staobserva, stafecisys, stahorisys,
                    stausuisys, staestisys, secmod, 'IM' AS tipo
                FROM cxptstatusoc
                WHERE ciacodigo = :ciacodigo AND cocid = :importacion
            """
            params["importacion"] = importacion

        # Ordenar resultados
        base_query += " ORDER BY stafecisys DESC, stahorisys DESC"

        # Mapeo de estados
        status_map = {
            "E": {"OC": "ESPERA", "GA": "ESPERA", "IM": "ESPERA"},
            "P": "PENDIENTE",
            "D": {"OC": "REVISAR ORDEN", "GA": "REVISAR GASTO ASOCIADO"},
            "A": {"OC": "APROBADA", "GA": "APROBADO", "IM": "ACTIVA"},
            "N": {"OC": "ANULADA", "GA": "ANULADO"},
            "R": "REVISAR LIQUIDACION",
            "L": "LIQUIDADA",
            "C": "CERRADA",
        }

        observaciones = []
        # Ejecutar consulta principal
        result = connection.execute(text(base_query), params).mappings().fetchall()

        for row in result:
            obs = dict(row)

            # Traducir estado
            status_code = obs["stastatus"]
            status_text = status_code  # Valor por defecto

            if status_code in status_map:
                mapping = status_map[status_code]
                if isinstance(mapping, dict):
                    status_text = mapping.get(tipo, status_code)
                else:
                    status_text = mapping

            # Obtener nombre de usuario
            usuario_completo = obs["stausuisys"]
            if obs["stausuisys"]:
                user_query = """
                    SELECT usrnombre
                    FROM siaccusr
                    WHERE usrcodigo = :usuario
                """
                try:
                    user_result = connection.execute(text(user_query), {"usuario": encriptar(obs["stausuisys"])}).fetchone()

                    if user_result:
                        usuario_completo += f" - {desencriptar(user_result[0])}"
                except Exception as e:
                    print(e)
                    pass  # Mantener usuario base si hay error

            # Construir objeto final
            observaciones.append(
                {
                    "fecha": obs["stafecisys"].strftime("%Y-%m-%d"),
                    "hora": str(obs["stahorisys"]),
                    "accion": obs["staaccion"],
                    "modulo": obs["secmod"],
                    "observacion": obs["staobserva"],
                    "estado": status_text,
                    "usuario": usuario_completo,
                    "documentoRelacionado": obs["impcodimportacion"] or "",
                    "tipoObservacion": obs["tipo"],
                }
            )

        return observaciones

    except Exception as e:
        raise Exception(f"Error al obtener observaciones: {str(e)}")
