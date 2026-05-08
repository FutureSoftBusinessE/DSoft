from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.SectorialesIess import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/updateSectorialesIess", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateSectorialesIess():
    # 1. Extracción de sesión y contexto de auditoría
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora para auditoría
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    
    # Identificadores de la Clave Primaria (Old para el WHERE, New por si se editan)
    seccodigo_old = data.get("seccodigoOld", data.get("seccodigo"))
    seccodigo_new = data.get("seccodigoNew", data.get("seccodigo"))
    secanio_old = data.get("secanioOld", data.get("secanio"))
    secanio_new = data.get("secanioNew", data.get("secanio"))
    
    # Campos a actualizar
    seccargo = data.get("seccargo")
    secestruc = data.get("secestruc")
    secdetalle = data.get("secdetalle")
    secsalario = data.get("secsalario", 0)
    secstatus = data.get("secstatus", "A")

    # 3. Validaciones de integridad
    if not seccodigo_old or not seccodigo_new:
        raise ValidationError("El código del sectorial es requerido")
    if not secanio_old or not secanio_new:
        raise ValidationError("El año es requerido")
    if not seccargo:
        raise ValidationError("La descripción del cargo o actividad es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de parámetros con limpieza de strings
            data_update = {
                "ciacodigo": sCodCia,
                "seccodigoOld": str(seccodigo_old).strip().upper()[:15],
                "seccodigoNew": str(seccodigo_new).strip().upper()[:15],
                "secanioOld": int(secanio_old),
                "secanioNew": int(secanio_new),
                
                "seccargo": str(seccargo).strip().upper()[:200],
                "secestruc": str(secestruc).strip().upper()[:10] if secestruc else "",
                "secdetalle": str(secdetalle).strip().upper()[:500] if secdetalle else "",
                "secsalario": float(secsalario),
                "secstatus": str(secstatus).strip().upper()[:1],
                
                # Auditoría de Modificación (msys)
                "secfecmsys": fecha_pura,
                "sechormsys": hora_pura,
                "secusumsys": sUsuario,
                "secestmsys": sNomEst,
            }

            # 5. Sentencia SQL de actualización
            update_query = text(
                """
                UPDATE nomsectorialiess SET
                    seccodigo = :seccodigoNew,
                    secanio = :secanioNew,
                    seccargo = :seccargo,
                    secestruc = :secestruc,
                    secdetalle = :secdetalle,
                    secsalario = :secsalario,
                    secstatus = :secstatus,
                    secfecmsys = :secfecmsys,
                    sechormsys = :sechormsys,
                    secusumsys = :secusumsys,
                    secestmsys = :secestmsys
                WHERE ciacodigo = :ciacodigo 
                  AND seccodigo = :seccodigoOld 
                  AND secanio = :secanioOld
            """
            )

            try:
                connection.execute(update_query, data_update)
            except IntegrityError:
                # 6. Manejo de errores por duplicados o registros vinculados
                raise ValidationError("No se puede actualizar el Sectorial. Verifique que el nuevo código/año no exista ya o que no tenga procesos de nómina vinculados.")

    return {"data": "Sectorial actualizado exitosamente"}