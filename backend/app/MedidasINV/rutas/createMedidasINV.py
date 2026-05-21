from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.MedidasINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createMedidasINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createMedidasINV():
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

    # 3. Extracción de campos según la estructura de la tabla inbmed
    medcodigo = data.get("medcodigo")
    meddescri = data.get("meddescri")
    medstatus = data.get("medstatus", "A")

    # 4. Validaciones de campos obligatorios
    if not medcodigo or str(medcodigo).strip() == "":
        raise ValidationError("El Código de la Medida es requerido")
    if not meddescri or str(meddescri).strip() == "":
        raise ValidationError("La descripción de la Medida es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Formateo y truncado según la estructura técnica [varchar(3) y varchar(30)]
            medcodigo = str(medcodigo).strip().upper()[:3]
            meddescri = str(meddescri).strip().upper()[:30]
            # 5. Verificación de Duplicados (PK: ciacodigo + medcodigo)
            check_data = {"ciacodigo": sCodCia, "medcodigo": medcodigo}
            check_query = text(
                """
                SELECT medcodigo
                FROM inbmed
                WHERE ciacodigo = :ciacodigo
                  AND medcodigo = :medcodigo
            """
            )
            result = connection.execute(check_query, check_data).mappings().fetchone()
            if result:
                raise ValidationError(f"Ya existe una Unidad de Medida registrada con el código '{medcodigo}'")

            # 6. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "medcodigo": medcodigo,
                "meddescri": meddescri,
                "medstatus": str(medstatus).strip().upper()[:1],
                # Auditoría de Inserción
                "medfecisys": fecha_pura,
                "medhorisys": hora_pura,
                # varchar(10)
                "medusuisys": sUsuario[:10],
                # Auditoría de Modificación
                "medfecmsys": fecha_pura,
                "medhormsys": hora_pura,
                # varchar(10)
                "medusumsys": sUsuario[:10],
            }

            insert_query = text(
                """
                INSERT INTO inbmed (
                    ciacodigo, medcodigo, meddescri, medstatus,
                    medfecisys, medhorisys, medusuisys,
                    medfecmsys, medhormsys, medusumsys
                ) VALUES (
                    :ciacodigo, :medcodigo, :meddescri, :medstatus,
                    :medfecisys, :medhorisys, :medusuisys,
                    :medfecmsys, :medhormsys, :medusumsys
                )
            """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Unidad de Medida creada exitosamente"}
