from flask import request
from app.Instituciones import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/createInstituciones", methods=["POST"])
@jwt_required()
@api_endpoint
def createInstituciones():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE VARIABLES GLOBALES[cite: 21]
    try:
        seleccion = claims["seleccion"]
        clicianonBD = seleccion["clicianonBD"]
        # Al ser un catálogo global, no requerimos cliciaciacodigo[cite: 21]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. No se encontró la base de datos.")

    # El usuario se toma directamente del claim 'user'[cite: 21]
    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar el usuario en la sesión actual.")

    # Ajuste de longitud para varchar(10) según la tabla[cite: 21]
    sUsuario = str(sUsuario)[:10]

    # Estación de trabajo (Auditoría) - varchar(40) según la tabla gdocbinstituciones[cite: 21]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    sNomEst = str(sNomEst)[:40]

    # 2. OBTENER Y VALIDAR PARÁMETROS DEL FRONTEND[cite: 21]
    data = request.get_json()
    codigo = data.get("insticodigo")
    descri = data.get("instidescri")
    url = data.get("instiurl")

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código de la Institución es obligatorio.")

    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción de la Institución es obligatoria.")

    # Normalización de datos y límites de tabla[cite: 21]
    codigo = str(codigo).strip().upper()[:3]  # varchar(3)[cite: 21]
    descri = str(descri).strip().upper()[:60]  # varchar(60)[cite: 21]
    url = str(url).strip()[:250] if url else None  # varchar(250) NULL
    status = str(data.get("instistatus", "A")).strip().upper()[:1]  # varchar(1)[cite: 21]

    # Tiempos de Auditoría[cite: 21]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. VERIFICAR SI EL CÓDIGO YA EXISTE (Llave Primaria)[cite: 21]
            check_sql = text("SELECT insticodigo FROM gdocbinstituciones WHERE insticodigo = :cod")
            existe = connection.execute(check_sql, {"cod": codigo}).fetchone()

            if existe:
                raise ValidationError(f"El código de Institución '{codigo}' ya se encuentra registrado.")

            # 4. INSERCIÓN EN TABLA gdocbinstituciones[cite: 21]
            insert_sql = text(
                """
                INSERT INTO gdocbinstituciones (
                    insticodigo, instidescri, instiurl, instistatus,
                    instifecisys, instihorisys, instiusuisys, instiestisys,
                    instifecmsys, instihormsys, instiusumsys, instiestmsys
                ) VALUES (
                    :cod, :des, :url, :sta,
                    :fec, :hor, :usu, :est,
                    :fec, :hor, :usu, :est
                )
                """
            )

            connection.execute(
                insert_sql,
                {
                    "cod": codigo,
                    "des": descri,
                    "url": url,
                    "sta": status,
                    "fec": fecha_pura,
                    "hor": hora_pura,
                    "usu": sUsuario,
                    "est": sNomEst,
                },
            )

    return {"data": "Institución creada exitosamente"}
