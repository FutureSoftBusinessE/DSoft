from flask import request
from app.SecuenciasInternas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarSecuenciasInternas", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarSecuenciasInternas():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE SEGURIDAD
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = seleccion["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. Transacción abortada.")

    # 2. VALIDAR PARÁMETROS DE LA LLAVE COMPUESTA
    data = request.get_json()
    locservidor = data.get("locservidor")
    seccodigo = data.get("seccodigo")

    if not locservidor or str(locservidor).strip() == "":
        raise ValidationError("El Local/Servidor (locservidor) es obligatorio para proceder con la eliminación.")

    if not seccodigo or str(seccodigo).strip() == "":
        raise ValidationError("El código de secuencia (seccodigo) es obligatorio para proceder con la eliminación.")

    locservidor = str(locservidor).strip().upper()
    seccodigo = str(seccodigo).strip().upper()

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. ELIMINACIÓN DE DATOS (Filtrando por la llave primaria compuesta)
            delete_query = text(
                """
                DELETE FROM siacsec
                WHERE ciacodigo = :cia
                  AND locservidor = :loc
                  AND seccodigo = :cod
                """
            )
            result = connection.execute(delete_query, {"cia": sCodCia, "loc": locservidor, "cod": seccodigo})

            # Si no se afectó ninguna fila, significa que el registro no existía
            if result.rowcount == 0:
                raise ValidationError("No se pudo eliminar: el registro no existe o ya fue borrado.")

    return {"data": "Secuencia Interna eliminada exitosamente"}
