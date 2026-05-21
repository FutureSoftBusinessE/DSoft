from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.MarcasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createMarcasINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createMarcasINV():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # 3. Extracción de campos según la estructura de la tabla inbmar
    marcodigo = data.get("marcodigo")
    mardescri = data.get("mardescri")
    marstatus = data.get("marstatus", "A")

    # 4. Validaciones de campos obligatorios
    if not marcodigo or str(marcodigo).strip() == "":
        raise ValidationError("El Código de la Marca es requerido")
    if not mardescri or str(mardescri).strip() == "":
        raise ValidationError("La descripción de la Marca es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Formateo y truncado según la estructura técnica [varchar(5) y varchar(30)]
            marcodigo = str(marcodigo).strip().upper()[:5]
            mardescri = str(mardescri).strip().upper()[:30]

            # 5. Verificación de Duplicados (PK: ciacodigo + marcodigo)
            check_data = {"ciacodigo": sCodCia, "marcodigo": marcodigo}
            check_query = text(
                """
                SELECT marcodigo
                FROM inbmar
                WHERE ciacodigo = :ciacodigo
                  AND marcodigo = :marcodigo
            """
            )
            result = connection.execute(check_query, check_data).mappings().fetchone()
            if result:
                raise ValidationError(f"Ya existe una Marca registrada con el código '{marcodigo}'")

            # 6. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "marcodigo": marcodigo,
                "mardescri": mardescri,
                "marstatus": str(marstatus).strip().upper()[:1],
                # Auditoría de Inserción
                "marfecisys": fecha_pura,
                "marhorisys": hora_pura,
                # Truncado a varchar(10)
                "marusuisys": sUsuario[:10],
                # Auditoría de Modificación
                "marfecmsys": fecha_pura,
                "marhormsys": hora_pura,
                # Truncado a varchar(10)
                "marusumsys": sUsuario[:10],
            }

            insert_query = text(
                """
                INSERT INTO inbmar (
                    ciacodigo, marcodigo, mardescri, marstatus,
                    marfecisys, marhorisys, marusuisys,
                    marfecmsys, marhormsys, marusumsys
                ) VALUES (
                    :ciacodigo, :marcodigo, :mardescri, :marstatus,
                    :marfecisys, :marhorisys, :marusuisys,
                    :marfecmsys, :marhormsys, :marusumsys
                )
            """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Marca de inventario creada exitosamente"}
