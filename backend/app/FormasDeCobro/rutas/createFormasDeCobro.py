from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.FormasDeCobro import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createFormasDeCobro", methods=["POST"])
@jwt_required()
@api_endpoint
def createFormasDeCobro():
    # 1. Extracción de sesión [cite: 85]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    # Nota: No extraemos X-Forwarded-For porque cxcbformapag no usa campos estisys/estmsys
    # 2. Lógica de separación de Fecha y Hora puras
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # Recepción de datos del Frontend [cite: 86]
    factippag = data.get("factippag")
    fordescri = data.get("fordescri")
    fordias = data.get("fordias", 0)
    fortipo = data.get("fortipo")
    forcuotas = data.get("forcuotas", 0)
    forstatus = data.get("forstatus", "A")

    # 3. Validaciones de negocio [cite: 86, 87]
    if not factippag or str(factippag).strip() == "":
        raise ValidationError("El código de la forma de cobro es requerido (factippag)")
    if not fordescri or str(fordescri).strip() == "":
        raise ValidationError("La descripción de la forma de cobro es requerida")
    if not fortipo or str(fortipo).strip() == "":
        raise ValidationError("El tipo de forma de cobro es requerido (fortipo)")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Limpieza y formateo basado en la tabla cxcbformapag [cite: 87, 88]
            factippag = str(factippag).strip().upper()[:3]
            fordescri = str(fordescri).strip().upper()[:40]
            fortipo = str(fortipo).strip().upper()[:2]
            forstatus = str(forstatus).strip().upper()[:1]

            try:
                fordias = float(fordias)
                forcuotas = int(forcuotas)
            except ValueError:
                raise ValidationError("Los campos de días y cuotas deben ser numéricos")

            # Validación de duplicados (Clave principal: Cia + Forma de Cobro) [cite: 88, 89]
            data_getAll = {
                "ciacodigo": sCodCia,
                "factippag": factippag,
            }
            getAll = text(
                """
                SELECT factippag
                FROM cxcbformapag
                WHERE ciacodigo = :ciacodigo
                  AND factippag = :factippag
                """
            )
            result = connection.execute(getAll, data_getAll).mappings().fetchone()

            if result:
                raise ValidationError(f"La Forma de Cobro '{factippag}' ya existe en la compañía actual")

            # 4. Asignación al diccionario de inserción [cite: 91, 92]
            data_insert = {
                "ciacodigo": sCodCia,
                "factippag": factippag,
                "fordescri": fordescri,
                "fordias": fordias,
                "fortipo": fortipo,
                "forcuotas": forcuotas,
                "forstatus": forstatus,
                # Auditoría separada en fechas y horas puras [cite: 92, 93, 94]
                "forfecisys": fecha_pura,
                "forhorisys": hora_pura,
                "forusuisys": str(sUsuario)[:10],
                "forfecmsys": fecha_pura,
                "forhormsys": hora_pura,
                "forusumsys": str(sUsuario)[:10],
            }

            # 5. Sentencia SQL [cite: 94, 95]
            insert_query = text(
                """
                INSERT INTO cxcbformapag (
                    ciacodigo, factippag, fordescri, fordias, fortipo, forcuotas, forstatus,
                    forfecisys, forhorisys, forusuisys,
                    forfecmsys, forhormsys, forusumsys
                ) VALUES (
                    :ciacodigo, :factippag, :fordescri, :fordias, :fortipo, :forcuotas, :forstatus,
                    :forfecisys, :forhorisys, :forusuisys,
                    :forfecmsys, :forhormsys, :forusumsys
                )
                """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Forma de Cobro creada exitosamente"}
