from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ExcepcionesdeIVA import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createExcepcionesdeIVA", methods=["POST"])
@jwt_required()
@api_endpoint
def createExcepcionesdeIVA():
    # 1. Extracción de sesión y variables de auditoría
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # Recepción de datos del Frontend mapeados a 'siacivaexcepcion'
    ivetipocompania = data.get("ivetipocompania")
    ivefecinicio = data.get("ivefecinicio")
    ivefectermino = data.get("ivefectermino")
    iveporcentajeactual = data.get("iveporcentajeactual", 0)
    iveporcentajeresolucion = data.get("iveporcentajeresolucion", 0)
    ivenumresolucion = data.get("ivenumresolucion")
    ivemotivo = data.get("ivemotivo")
    ivestatus = data.get("ivestatus", "A")

    # 3. Validaciones de negocio (Campos NOT NULL según esquema)
    if not ivetipocompania or str(ivetipocompania).strip() == "":
        raise ValidationError("El Tipo de Compañía es requerido (ivetipocompania)")
    if not ivefecinicio or str(ivefecinicio).strip() == "":
        raise ValidationError("La fecha de inicio es requerida")
    if not ivefectermino or str(ivefectermino).strip() == "":
        raise ValidationError("La fecha de término es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Limpieza y casteos basados en la tabla siacivaexcepcion
            ivetipocompania = str(ivetipocompania).strip().upper()[:3]
            ivestatus = str(ivestatus).strip().upper()[:1]
            sNomEst = str(sNomEst)[:50]

            # Manejo de campos nulos permitidos
            ivenumresolucion = str(ivenumresolucion).strip().upper()[:30] if ivenumresolucion else None
            ivemotivo = str(ivemotivo).strip().upper()[:255] if ivemotivo else None

            try:
                iveporcentajeactual = float(iveporcentajeactual)
                iveporcentajeresolucion = float(iveporcentajeresolucion)
            except ValueError:
                raise ValidationError("Los porcentajes deben ser valores numéricos válidos")

            # Validación de duplicados (Llave primaria compuesta: ivetipocompania + ivefecinicio)
            data_getAll = {
                "ivetipocompania": ivetipocompania,
                "ivefecinicio": ivefecinicio,
            }
            getAll = text(
                """
                SELECT ivetipocompania
                FROM siacivaexcepcion
                WHERE ivetipocompania = :ivetipocompania
                  AND ivefecinicio = :ivefecinicio
                """
            )
            result = connection.execute(getAll, data_getAll).mappings().fetchone()

            if result:
                raise ValidationError(f"Ya existe una excepción de IVA configurada para el tipo de compañía '{ivetipocompania}' en la fecha de inicio indicada.")

            # 4. Asignación al diccionario de inserción
            data_insert = {
                "ivetipocompania": ivetipocompania,
                "ivefecinicio": ivefecinicio,
                "ivefectermino": ivefectermino,
                "iveporcentajeactual": iveporcentajeactual,
                "iveporcentajeresolucion": iveporcentajeresolucion,
                "ivenumresolucion": ivenumresolucion,
                "ivemotivo": ivemotivo,
                "ivestatus": ivestatus,
                # Auditoría separada en fechas y horas puras
                "ivefecisys": fecha_pura,
                "ivehorisys": hora_pura,
                "iveusuisys": str(sUsuario)[:10],
                "iveestisys": sNomEst,
                "ivefecmsys": fecha_pura,
                "ivehormsys": hora_pura,
                "iveusumsys": str(sUsuario)[:10],
                "iveestmsys": sNomEst,
            }

            # 5. Sentencia SQL de Inserción
            insert_query = text(
                """
                INSERT INTO siacivaexcepcion (
                    ivetipocompania, ivefecinicio, ivefectermino,
                    iveporcentajeactual, iveporcentajeresolucion, ivenumresolucion,
                    ivemotivo, ivestatus,
                    ivefecisys, ivehorisys, iveusuisys, iveestisys,
                    ivefecmsys, ivehormsys, iveusumsys, iveestmsys
                ) VALUES (
                    :ivetipocompania, :ivefecinicio, :ivefectermino,
                    :iveporcentajeactual, :iveporcentajeresolucion, :ivenumresolucion,
                    :ivemotivo, :ivestatus,
                    :ivefecisys, :ivehorisys, :iveusuisys, :iveestisys,
                    :ivefecmsys, :ivehormsys, :iveusumsys, :iveestmsys
                )
                """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Excepción de IVA creada exitosamente"}
