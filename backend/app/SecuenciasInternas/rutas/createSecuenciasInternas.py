from flask import request
from app.SecuenciasInternas import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/createSecuenciasInternas", methods=["POST"])
@jwt_required()
@api_endpoint
def createSecuenciasInternas():
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

    # Ajuste de longitud para varchar(10)
    sUsuario = str(sUsuario)[:10]

    # 2. OBTENER Y VALIDAR PARÁMETROS DEL FRONTEND
    data = request.get_json()
    locservidor = data.get("locservidor")
    seccodigo = data.get("seccodigo")
    secnumero = data.get("secnumero")
    secdescri = data.get("secdescri")

    # Validaciones de campos obligatorios
    if not locservidor or str(locservidor).strip() == "":
        raise ValidationError("El Local/Servidor (locservidor) es obligatorio.")

    if not seccodigo or str(seccodigo).strip() == "":
        raise ValidationError("El código de secuencia (seccodigo) es obligatorio.")

    if secnumero is None or str(secnumero).strip() == "":
        raise ValidationError("El número de secuencia (secnumero) es obligatorio.")

    try:
        # La tabla espera un decimal(18, 0) que a nivel lógico es un entero grande
        secnumero = int(secnumero)
    except ValueError:
        raise ValidationError("El número de secuencia debe ser un valor numérico entero.")

    if not secdescri or str(secdescri).strip() == "":
        raise ValidationError("La descripción de la secuencia es obligatoria.")

    # Normalización de datos y límites de tabla
    locservidor = str(locservidor).strip().upper()[:1]  # varchar(1)
    seccodigo = str(seccodigo).strip().upper()[:3]  # varchar(3)
    secdescri = str(secdescri).strip().upper()[:200]  # varchar(200)

    # Tiempos de Auditoría
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. VERIFICAR SI LA LLAVE PRIMARIA COMPUESTA YA EXISTE
            check_sql = text(
                """
                SELECT seccodigo FROM siacsec
                WHERE ciacodigo = :cia
                  AND locservidor = :loc
                  AND seccodigo = :cod
                """
            )
            existe = connection.execute(check_sql, {"cia": sCodCia, "loc": locservidor, "cod": seccodigo}).fetchone()

            if existe:
                raise ValidationError(f"La secuencia '{seccodigo}' ya existe para el servidor '{locservidor}' en esta compañía.")

            # 4. INSERCIÓN EN TABLA siacsec (11 Columnas en total)
            insert_sql = text(
                """
                INSERT INTO siacsec (
                    ciacodigo, locservidor, seccodigo, secnumero, secdescri,
                    secfecisys, sechorisys, secusuisys,
                    secfecmsys, sechormsys, secusumsys
                ) VALUES (
                    :cia, :loc, :cod, :num, :des,
                    :fec, :hor, :usu,
                    :fec, :hor, :usu
                )
                """
            )

            connection.execute(
                insert_sql,
                {
                    "cia": sCodCia,
                    "loc": locservidor,
                    "cod": seccodigo,
                    "num": secnumero,
                    "des": secdescri,
                    "fec": fecha_pura,
                    "hor": hora_pura,
                    "usu": sUsuario,
                },
            )

    return {"data": "Secuencia Interna creada exitosamente"}
