from flask import request
from app.TipodeContraCli import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/createTipodeContraCli", methods=["POST"])
@jwt_required()
@api_endpoint
def createTipodeContraCli():
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

    # Estación de trabajo (Auditoría) - varchar(50)
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr) or "FSOFTAPP"
    sNomEst = str(sNomEst)[:50]

    # 2. OBTENER Y VALIDAR PARÁMETROS DEL FRONTEND
    data = request.get_json()
    codigo = data.get("concodigo")
    descri = data.get("condescri")
    frecuencia = data.get("confrecuencia")

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código de contrato es obligatorio.")

    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción del contrato es obligatoria.")

    if not frecuencia:
        raise ValidationError("Debe seleccionar una frecuencia para el contrato.")

    # Regla de Negocio: Validar Frecuencias permitidas
    frecuencias_validas = ["MENSUAL", "BIMESTRAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]
    frecuencia = str(frecuencia).strip().upper()

    if frecuencia not in frecuencias_validas:
        raise ValidationError(f"Frecuencia inválida. Debe ser una de las siguientes: {', '.join(frecuencias_validas)}")

    # Normalización de datos y límites de tabla
    codigo = str(codigo).strip().upper()[:3]  # varchar(3)
    descri = str(descri).strip().upper()[:60]  # varchar(60)
    status = str(data.get("constatus", "A")).upper()[:1]  # varchar(1)

    # Tiempos de Auditoría
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. VERIFICAR SI EL CÓDIGO YA EXISTE (Llave Primaria)
            check_sql = text("SELECT concodigo FROM cxcbtipcon WHERE ciacodigo = :cia AND concodigo = :cod")
            existe = connection.execute(check_sql, {"cia": sCodCia, "cod": codigo}).fetchone()

            if existe:
                raise ValidationError(f"El código de contrato '{codigo}' ya existe para esta compañía.")

            # 4. INSERCIÓN EN TABLA cxcbtipcon (13 Columnas de auditoría completa)
            insert_sql = text(
                """
                INSERT INTO cxcbtipcon (
                    ciacodigo, concodigo, condescri, confrecuencia, constatus,
                    confecisys, conhorisys, conusuisys, conestisys,
                    confecmsys, conhormsys, conusumsys, conestmsys
                ) VALUES (
                    :cia, :cod, :des, :fre, :sta,
                    :fec, :hor, :usu, :est,
                    :fec, :hor, :usu, :est
                )
            """
            )

            connection.execute(insert_sql, {"cia": sCodCia, "cod": codigo, "des": descri, "fre": frecuencia, "sta": status, "fec": fecha_pura, "hor": hora_pura, "usu": sUsuario, "est": sNomEst})

    return {"data": "Tipo de Contrato creado exitosamente"}
