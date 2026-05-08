from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.PresentacionesINV import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/createPresentacionesINV", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createPresentacionesINV():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    
    # 3. Extracción de campos según estructura de tabla inbpre
    precodigo = data.get("precodigo")
    predescri = data.get("predescri")
    prestatus = data.get("prestatus", "A")

    # 4. Validaciones de campos obligatorios
    if not precodigo or str(precodigo).strip() == "":
        raise ValidationError("El Código de la Presentación es requerido")
    if not predescri or str(predescri).strip() == "":
        raise ValidationError("La descripción de la Presentación es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # Formateo y truncado según estructura varchar(2) y varchar(30)
            precodigo = str(precodigo).strip().upper()[:2]
            predescri = str(predescri).strip().upper()[:30]
            
            # 5. Verificación de Duplicados (PK: ciacodigo + precodigo)
            check_data = {
                "ciacodigo": sCodCia,
                "precodigo": precodigo
            }
            check_query = text("""
                SELECT precodigo 
                FROM inbpre 
                WHERE ciacodigo = :ciacodigo 
                  AND precodigo = :precodigo
            """)
            result = connection.execute(check_query, check_data).mappings().fetchone()
            
            if result:
                raise ValidationError(f"Ya existe una Presentación registrada con el código '{precodigo}'")

            # 6. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "precodigo": precodigo,
                "predescri": predescri,
                "prestatus": str(prestatus).strip().upper()[:1],
                
                # Auditoría de Inserción
                "prefecisys": fecha_pura,
                "prehorisys": hora_pura,
                "preusuisys": sUsuario[:10], # varchar(10) en inbpre
                
                # Auditoría de Modificación
                "prefecmsys": fecha_pura,
                "prehormsys": hora_pura,
                "preusumsys": sUsuario[:10], # varchar(10) en inbpre
            }

            insert_query = text(
                """
                INSERT INTO inbpre (
                    ciacodigo, precodigo, predescri, prestatus,
                    prefecisys, prehorisys, preusuisys,
                    prefecmsys, prehormsys, preusumsys
                ) VALUES (
                    :ciacodigo, :precodigo, :predescri, :prestatus,
                    :prefecisys, :prehorisys, :preusuisys,
                    :prefecmsys, :prehormsys, :preusumsys
                )
            """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Presentación de inventario creada exitosamente"}