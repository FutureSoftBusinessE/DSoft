from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.SectorialesIess import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/createSectorialesIess", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createSectorialesIess():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora pura
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    
    # 3. Extracción de campos según imagen y requerimiento
    seccodigo = data.get("seccodigo")  # Código IESS
    secanio = data.get("secanio")      # Año (Parte de la PK)
    seccargo = data.get("seccargo")    # Cargo o Actividad
    secestruc = data.get("secestruc")  # Estructura Ocupacional
    secdetalle = data.get("secdetalle")# Comentarios / Detalles
    secsalario = data.get("secsalario", 0) # Salario Mínimo
    secstatus = data.get("secstatus", "A")

    # 4. Validaciones de campos obligatorios para la Clave Primaria
    if not seccodigo or str(seccodigo).strip() == "":
        raise ValidationError("El Código IESS es requerido")
    if not secanio:
        raise ValidationError("El Año es requerido para el registro sectorial")
    if not seccargo or str(seccargo).strip() == "":
        raise ValidationError("La descripción del Cargo o Actividad es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # Formateo de datos
            seccodigo = str(seccodigo).strip().upper()[:15]
            secanio = int(secanio)
            seccargo = str(seccargo).strip().upper()[:200]
            secestruc = str(secestruc).strip().upper()[:10] if secestruc else ""
            secdetalle = str(secdetalle).strip().upper()[:500] if secdetalle else ""
            
            # 5. Verificación de Duplicados (PK Compuesta: Cia + Código IESS + Año)
            check_data = {
                "ciacodigo": sCodCia,
                "seccodigo": seccodigo,
                "secanio": secanio
            }
            check_query = text("""
                SELECT seccodigo 
                FROM nomsectorialiess 
                WHERE ciacodigo = :ciacodigo 
                  AND seccodigo = :seccodigo 
                  AND secanio = :secanio
            """)
            result = connection.execute(check_query, check_data).mappings().fetchone()
            
            if result:
                raise ValidationError(f"Ya existe un registro para el Código IESS '{seccodigo}' en el año {secanio}")

            # 6. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "seccodigo": seccodigo,
                "secanio": secanio,
                "seccargo": seccargo,
                "secestruc": secestruc,
                "secdetalle": secdetalle,
                "secsalario": float(secsalario),
                "secstatus": secstatus,
                
                # Auditoría de Inserción
                "secfecisys": fecha_pura,
                "sechorisys": hora_pura,
                "secusuisys": sUsuario,
                "secestisys": sNomEst,
                
                # Auditoría de Modificación
                "secfecmsys": fecha_pura,
                "sechormsys": hora_pura,
                "secusumsys": sUsuario,
                "secestmsys": sNomEst,
            }

            insert_query = text(
                """
                INSERT INTO nomsectorialiess (
                    ciacodigo, seccodigo, secanio, seccargo, secestruc, 
                    secdetalle, secsalario, secstatus,
                    secfecisys, sechorisys, secusuisys, secestisys,
                    secfecmsys, sechormsys, secusumsys, secestmsys
                ) VALUES (
                    :ciacodigo, :seccodigo, :secanio, :seccargo, :secestruc, 
                    :secdetalle, :secsalario, :secstatus,
                    :secfecisys, :sechorisys, :secusuisys, :secestisys,
                    :secfecmsys, :sechormsys, :secusumsys, :secestmsys
                )
            """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Registro Sectorial del IESS creado exitosamente"}