from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TipoDeCompania import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createTipoDeCompania", methods=["POST"])
@jwt_required()
@api_endpoint
def createTipoDeCompania():
    # 1. Extracción de sesión y variables de auditoría[cite: 19]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras[cite: 19]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # Recepción de datos del Frontend mapeados a 'siactipocompania'[cite: 19]
    tpcodigo = data.get("tpcodigo")
    tpdescripcion = data.get("tpdescripcion")
    tpobservacion = data.get("tpobservacion")
    tpstatus = data.get("tpstatus", "A")

    # 3. Validaciones de negocio (Campos NOT NULL según esquema)[cite: 19]
    if not tpcodigo or str(tpcodigo).strip() == "":
        raise ValidationError("El código de Tipo de Compañía es requerido (tpcodigo)")
    if not tpdescripcion or str(tpdescripcion).strip() == "":
        raise ValidationError("La descripción del Tipo de Compañía es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Limpieza y casteos basados en la tabla siactipocompania[cite: 19]
            tpcodigo = str(tpcodigo).strip().upper()[:3]
            tpdescripcion = str(tpdescripcion).strip().upper()[:100]
            tpstatus = str(tpstatus).strip().upper()[:1]
            sNomEst = str(sNomEst)[:50]

            # Manejo de campos nulos permitidos[cite: 19]
            tpobservacion = str(tpobservacion).strip().upper()[:255] if tpobservacion else None

            # Validación de duplicados (Llave primaria: tpcodigo)[cite: 19]
            data_getAll = {
                "tpcodigo": tpcodigo,
            }
            getAll = text(
                """
                SELECT tpcodigo
                FROM siactipocompania
                WHERE tpcodigo = :tpcodigo
                """
            )
            result = connection.execute(getAll, data_getAll).mappings().fetchone()

            if result:
                raise ValidationError(f"El Tipo de Compañía '{tpcodigo}' ya se encuentra registrado.")

            # 4. Asignación al diccionario de inserción[cite: 19]
            data_insert = {
                "tpcodigo": tpcodigo,
                "tpdescripcion": tpdescripcion,
                "tpobservacion": tpobservacion,
                "tpstatus": tpstatus,
                # Auditoría separada en fechas y horas puras[cite: 19]
                "tpfecisys": fecha_pura,
                "tphorisys": hora_pura,
                "tpusuisys": str(sUsuario)[:10],
                "tpestisys": sNomEst,
                "tpfecmsys": fecha_pura,
                "tphormsys": hora_pura,
                "tpusumsys": str(sUsuario)[:10],
                "tpestmsys": sNomEst,
            }

            # 5. Sentencia SQL de Inserción[cite: 19]
            insert_query = text(
                """
                INSERT INTO siactipocompania (
                    tpcodigo, tpdescripcion, tpobservacion, tpstatus,
                    tpfecisys, tphorisys, tpusuisys, tpestisys,
                    tpfecmsys, tphormsys, tpusumsys, tpestmsys
                ) VALUES (
                    :tpcodigo, :tpdescripcion, :tpobservacion, :tpstatus,
                    :tpfecisys, :tphorisys, :tpusuisys, :tpestisys,
                    :tpfecmsys, :tphormsys, :tpusumsys, :tpestmsys
                )
                """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Tipo de Compañía creado exitosamente"}
