from flask import request
from app.SecuenciasDoc import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarSecuenciasDoc", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarSecuenciasDoc():
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
    anio = data.get("dptoanio")
    loccodigo = data.get("loccodigo")
    modcodigo = data.get("modcodigo")  # Equivale a dptocodigo
    doccodigo = data.get("doccodigo")
    locservidor = data.get("locservidor", "A")

    if not anio:
        raise ValidationError("El año es obligatorio para proceder con la eliminación.")
    if not loccodigo or str(loccodigo).strip() == "":
        raise ValidationError("La localidad es obligatoria para proceder con la eliminación.")
    if not modcodigo or str(modcodigo).strip() == "":
        raise ValidationError("El módulo es obligatorio para proceder con la eliminación.")
    if not doccodigo or str(doccodigo).strip() == "":
        raise ValidationError("El código de documento es obligatorio para proceder con la eliminación.")

    # Normalización
    try:
        anio = int(anio)
    except ValueError:
        raise ValidationError("El año debe ser numérico.")

    loccodigo = str(loccodigo).strip().upper()[:2]
    dptocodigo = str(modcodigo).strip().upper()[:3]
    doccodigo = str(doccodigo).strip().upper()[:3]
    locservidor = str(locservidor).strip().upper()[:1]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. ELIMINACIÓN DE DATOS (Cruzando los 6 campos de la llave primaria)
            delete_query = text(
                """
                DELETE FROM cgpdpto
                WHERE ciacodigo = :cia
                  AND dptoanio = :anio
                  AND dptocodigo = :dpto
                  AND loccodigo = :loc
                  AND doccodigo = :doc
                  AND locservidor = :serv
                """
            )
            result = connection.execute(
                delete_query,
                {
                    "cia": sCodCia,
                    "anio": anio,
                    "dpto": dptocodigo,
                    "loc": loccodigo,
                    "doc": doccodigo,
                    "serv": locservidor,
                },
            )

            # Si no se afectó ninguna fila, significa que la combinación exacta no existía
            if result.rowcount == 0:
                raise ValidationError("No se pudo eliminar: la secuencia no existe o ya fue borrada por otro usuario.")

    return {"data": "Secuencia de documento eliminada exitosamente"}
