from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Instituciones import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importamos la función helper de validación estricta
from app.Instituciones.rutas.validarInstitucionesIMP import validar_instituciones


@bp.route("/insertarInstitucionesIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarInstitucionesIMP():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD[cite: 21]
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        # No extraemos 'cliciaciacodigo' porque la tabla gdocbinstituciones es global[cite: 21]
    except KeyError:
        raise ValidationError("Error Crítico: Sesión incompleta.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario en la sesión actual.")

    # Truncamos el usuario a 10 caracteres por límite de la tabla[cite: 21]
    sUsuario = str(sUsuario)[:10]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    # Truncamos la estación a 40 caracteres por límite de la tabla gdocbinstituciones[cite: 21]
    sNomEst = str(sNomEst)[:40]

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 2. OBTENER PARÁMETROS DEL MODAL[cite: 21]
    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. DOBLE VALIDACIÓN (Evita inyecciones si se interviene el frontend)[cite: 21]
            rows, summary = validar_instituciones(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. MAPEO PARA INSERCIÓN[cite: 21]
            to_insert = []
            for fila in rows:

                # Validación y control del nuevo campo instiurl (Varchar 250 NULL)
                url_val = fila.get("instiurl")
                url_val = str(url_val).strip()[:250] if url_val else None

                to_insert.append(
                    {
                        "insticodigo": str(fila.get("insticodigo", ""))[:3].upper(),
                        "instidescri": str(fila.get("instidescri", ""))[:60].upper(),
                        "instiurl": url_val,  # <-- NUEVO CAMPO AÑADIDO
                        "instistatus": str(fila.get("instistatus", "A")).strip().upper()[:1],
                        "instifecisys": fecha_pura,
                        "instihorisys": hora_pura,
                        "instiusuisys": sUsuario,
                        "instiestisys": sNomEst,
                        "instifecmsys": fecha_pura,
                        "instihormsys": hora_pura,
                        "instiusumsys": sUsuario,
                        "instiestmsys": sNomEst,
                    }
                )

            # 5. INSERCIÓN SQL[cite: 21]
            insert_sql = text(
                """
                INSERT INTO gdocbinstituciones (
                    insticodigo, instidescri, instiurl, instistatus,
                    instifecisys, instihorisys, instiusuisys, instiestisys,
                    instifecmsys, instihormsys, instiusumsys, instiestmsys
                ) VALUES (
                    :insticodigo, :instidescri, :instiurl, :instistatus,
                    :instifecisys, :instihorisys, :instiusuisys, :instiestisys,
                    :instifecmsys, :instihormsys, :instiusumsys, :instiestmsys
                )
                """
            )

            connection.execute(insert_sql, to_insert)

    return {"data": "Instituciones insertadas exitosamente", "inserted": len(to_insert)}
