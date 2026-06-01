from flask import request
from app.ServiciosNDNC import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/createServiciosNDNC", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createServiciosNDNC():
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

    sUsuario = str(sUsuario)[:10]

    # 2. OBTENER Y VALIDAR PARÁMETROS DEL FRONTEND
    data = request.get_json()

    serncnd = data.get("serncnd")  # 'D' = Debito, 'C' = Credito
    codigo = data.get("sercodigo")
    descri = data.get("serdescri")
    status = data.get("serstatus", "A")
    aplica_iva = data.get("aplica_iva", False)
    formulario_autorizado = data.get("formulario_autorizado", False)

    # Validaciones obligatorias
    if not serncnd or str(serncnd).strip() not in ["D", "C"]:
        raise ValidationError("Debe especificar un Tipo de Servicio válido (Débito o Crédito).")

    if not codigo or str(codigo).strip() == "":
        raise ValidationError("El código del servicio es obligatorio.")

    if not descri or str(descri).strip() == "":
        raise ValidationError("La descripción del servicio es obligatoria.")

    # Normalización de datos y límites de tabla
    serncnd = str(serncnd).strip().upper()[:1]  # varchar(1)
    codigo = str(codigo).strip().upper()[:3]  # varchar(3)
    descri = str(descri).strip().upper()[:40]  # varchar(40)
    status = str(status).strip().upper()[:1]  # varchar(1)

    # Conversión de Checkboxes (Booleanos) a Numéricos para la BD
    seriva = 1.0 if aplica_iva else 0.0
    serautor = 1 if formulario_autorizado else 0

    # Valores por defecto para campos no visibles en Frontend
    pctacodigo = "0"
    ttrcodigo = None

    # Tiempos de Auditoría estilo SIAC (Fechas separadas de Horas)
    now = datetime.now()
    fecha_cero = now.replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_1900 = datetime(1900, 1, 1, now.hour, now.minute, now.second)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. VERIFICAR SI EL CÓDIGO YA EXISTE (Llave Primaria)
            check_sql = text("SELECT sercodigo FROM cxcbser WHERE ciacodigo = :cia AND sercodigo = :cod")
            existe = connection.execute(check_sql, {"cia": sCodCia, "cod": codigo}).fetchone()

            if existe:
                raise ValidationError(f"El código de servicio '{codigo}' ya existe para esta compañía.")

            # 4. INSERCIÓN EN TABLA cxcbser
            insert_sql = text(
                """
                INSERT INTO cxcbser (
                    ciacodigo, sercodigo, pctacodigo, serdescri,
                    serfecisys, serfecmsys, serhorisys, serhormsys,
                    seriva, serstatus, serusuisys, serusumsys,
                    ttrcodigo, serncnd, serautor
                ) VALUES (
                    :cia, :cod, :pcta, :des,
                    :fec_isys, :fec_msys, :hor_isys, :hor_msys,
                    :iva, :sta, :usu_isys, :usu_msys,
                    :ttr, :ncnd, :autor
                )
                """
            )

            connection.execute(
                insert_sql,
                {
                    "cia": sCodCia,
                    "cod": codigo,
                    "pcta": pctacodigo,
                    "des": descri,
                    "fec_isys": fecha_cero,
                    "fec_msys": fecha_cero,
                    "hor_isys": fecha_1900,
                    "hor_msys": fecha_1900,
                    "iva": seriva,
                    "sta": status,
                    "usu_isys": sUsuario,
                    "usu_msys": sUsuario,
                    "ttr": ttrcodigo,
                    "ncnd": serncnd,
                    "autor": serautor,
                },
            )

    return {"data": "Servicio de Nota de Débito/Crédito creado exitosamente"}
