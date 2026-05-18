from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.PuntosEmisionSri import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/updatePuntosEmisionSri", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updatePuntosEmisionSri():
    # 1. Extracción de sesión y auditoría
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]
    sUsuario = str(claims.get("user", "WEB")).strip()[:10]
    sNomEst = str(request.headers.get("X-Forwarded-For", request.remote_addr) or "WEB").strip()[:30]

    # 2. Lógica de separación de Fecha y Hora
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    
    # 3. Extracción de parámetros (Llave primaria y campos editables)
    cjacodigo = str(data.get("cjacodigo", "")).strip().upper()[:3]
    cjadescri = str(data.get("cjadescri", "")).strip().upper()[:40]
    cjastatus = str(data.get("cjastatus", "A")).strip().upper()[:1]

    # Validaciones Estrictas
    if not cjacodigo:
        raise ValidationError("El código de la caja es requerido para la actualización.")
    if not cjadescri:
        raise ValidationError("La descripción (Nombre de la Caja) es requerida.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de variables
            data_update = {
                "ciacodigo": sCodCia,
                "cjacodigo": cjacodigo,
                "cjadescri": cjadescri,
                "cjastatus": cjastatus,
                
                # Asignación de fecha y hora para la auditoría de modificación
                "cjafecmsys": fecha_pura,
                "cjahormsys": hora_pura,
                "cjausumsys": sUsuario,
                "cjaestmsys": sNomEst,
            }

            # 5. Ejecutar la actualización solo sobre la tabla maestra fapcaja
            update_query = text(
                """
                UPDATE fapcaja SET
                    cjadescri = :cjadescri,
                    cjastatus = :cjastatus,
                    cjafecmsys = :cjafecmsys,
                    cjahormsys = :cjahormsys,
                    cjausumsys = :cjausumsys,
                    cjaestmsys = :cjaestmsys
                WHERE ciacodigo = :ciacodigo AND cjacodigo = :cjacodigo
                """
            )

            result = connection.execute(update_query, data_update)

            # 6. Validar si realmente se actualizó algo
            if result.rowcount == 0:
                raise ValidationError("No se encontró el Punto de Emisión especificado o no pertenece a su compañía.")

    return {"data": "Punto de Emisión actualizado exitosamente."}