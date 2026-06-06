from flask import request
from app.SecuenciasDoc import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/createSecuenciasDoc", methods=["POST"])
@jwt_required()
@api_endpoint
def createSecuenciasDoc():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE VARIABLES GLOBALES
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        sCodCia = seleccion["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. No se encontró la configuración de la compañía.")

    # El usuario se toma directamente del claim 'user'
    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar el usuario en la sesión actual.")

    # Ajuste de longitud para varchar(10) de los campos de auditoría
    sUsuario = str(sUsuario)[:10]

    # 2. OBTENER Y VALIDAR PARÁMETROS DEL FRONTEND
    data = request.get_json()
    anio = data.get("dptoanio")
    loccodigo = data.get("loccodigo")
    modcodigo = data.get("modcodigo")  # Corresponde a dptocodigo según relación con siacdoc
    doccodigo = data.get("doccodigo")
    descri = data.get("dptodescri")
    numsec = data.get("dptonumsec")
    locservidor = data.get("locservidor", "A")  # Por defecto 'A' según su constraint de BD

    # Validaciones de campos obligatorios
    if not anio:
        raise ValidationError("El año (dptoanio) es obligatorio.")
    if not loccodigo or str(loccodigo).strip() == "":
        raise ValidationError("La localidad (loccodigo) es obligatoria.")
    if not modcodigo or str(modcodigo).strip() == "":
        raise ValidationError("El módulo (modcodigo) es obligatorio.")
    if not doccodigo or str(doccodigo).strip() == "":
        raise ValidationError("El código de documento (doccodigo) es obligatorio.")
    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción de la secuencia es obligatoria.")
    if numsec is None or str(numsec).strip() == "":
        raise ValidationError("El número de secuencia inicial es obligatorio.")

    # Normalización de datos y límites de tabla
    try:
        anio = int(anio)
    except ValueError:
        raise ValidationError("El año debe ser un valor numérico.")

    try:
        numsec = float(numsec)
    except ValueError:
        raise ValidationError("El número de secuencia debe ser un valor numérico.")

    loccodigo = str(loccodigo).strip().upper()[:2]
    dptocodigo = str(modcodigo).strip().upper()[:3]
    doccodigo = str(doccodigo).strip().upper()[:3]
    descri = str(descri).strip().upper()[:100]
    locservidor = str(locservidor).strip().upper()[:1]

    # Tiempos de Auditoría
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. VERIFICAR SI EL REGISTRO YA EXISTE (Llave Primaria Compuesta)
            check_sql = text(
                """
                SELECT dptocodigo
                FROM cgpdpto
                WHERE ciacodigo = :cia
                  AND dptoanio = :anio
                  AND dptocodigo = :dpto
                  AND loccodigo = :loc
                  AND doccodigo = :doc
                  AND locservidor = :serv
                """
            )
            existe = connection.execute(
                check_sql,
                {
                    "cia": sCodCia,
                    "anio": anio,
                    "dpto": dptocodigo,
                    "loc": loccodigo,
                    "doc": doccodigo,
                    "serv": locservidor,
                },
            ).fetchone()

            if existe:
                raise ValidationError(f"Ya existe una secuencia configurada para el documento '{doccodigo}' " f"en el módulo '{dptocodigo}' y localidad '{loccodigo}' para el año {anio}.")

            # 4. INSERCIÓN EN TABLA cgpdpto (Con auditoría completa)
            insert_sql = text(
                """
                INSERT INTO cgpdpto (
                    ciacodigo, dptoanio, dptocodigo, dptodescri, loccodigo,
                    doccodigo, locservidor, dptonumsec,
                    dptofecisys, dptohorisys, dptousuisys,
                    dptofecmsys, dptohormsys, dptousumsys
                ) VALUES (
                    :cia, :anio, :dpto, :des, :loc,
                    :doc, :serv, :sec,
                    :fec, :hor, :usu,
                    :fec, :hor, :usu
                )
                """
            )

            connection.execute(
                insert_sql,
                {
                    "cia": sCodCia,
                    "anio": anio,
                    "dpto": dptocodigo,
                    "des": descri,
                    "loc": loccodigo,
                    "doc": doccodigo,
                    "serv": locservidor,
                    "sec": numsec,
                    "fec": fecha_pura,
                    "hor": hora_pura,
                    "usu": sUsuario,
                },
            )

    return {"data": "Secuencia de documento creada exitosamente"}
