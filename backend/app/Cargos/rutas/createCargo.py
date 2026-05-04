from flask import request
from app.Cargos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


@bp.route("/createCargo", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint  # Decorador estándar de SIACDEV1.0 para manejo de respuestas y errores
def createCargo():
    claims = get_jwt()

    # 1. VALIDACIÓN ESTRICTA DE VARIABLES GLOBALES (Manejado con excepciones del sistema)
    try:
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    except KeyError:
        raise ValidationError("Error de Seguridad: Sesión incompleta. No se encontró código de compañía o base de datos.")

    # Tomamos el usuario desencriptado directamente de "user" según el nuevo estándar
    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar el usuario en la sesión actual.")

    # 2. OBTENER Y VALIDAR PARÁMETROS
    data = request.get_json()
    codigo = data.get("cargocodigo")
    descri = data.get("cargodescri")

    if codigo is None or str(codigo).strip() == "":
        raise ValidationError("El código de cargo es requerido.")

    if descri is None or str(descri).strip() == "":
        raise ValidationError("La descripción del cargo es requerida.")

    codigo = str(codigo).strip().upper()
    descri = str(descri).strip().upper()
    sueldo = data.get("carsueldo", 0)
    status = data.get("cargostatus", "A")

    # Auditoría de Tiempo
    ahora = datetime.now()
    fecha_pura = ahora.strftime("%Y-%m-%d 00:00:00")
    hora_pura = ahora.strftime("1900-01-01 %H:%M:%S")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 3. VERIFICAR DUPLICADOS EN BASE DE DATOS
            check_query = text("SELECT cargocodigo FROM rhbcargos WHERE ciacodigo = :cia AND cargocodigo = :codigo")
            result = connection.execute(check_query, {"cia": ciacodigo, "codigo": codigo}).fetchone()

            if result:
                raise ValidationError(f"El cargo con código '{codigo}' ya existe en el sistema.")

            # 4. INSERCIÓN DE DATOS
            insert_query = text(
                """
                INSERT INTO rhbcargos (
                    ciacodigo, cargocodigo, cargodescri, carsueldo, cargostatus,
                    cargofecisys, cargohorisys, cargousuisys,
                    cargofecmsys, cargohormsys, cargousumsys
                ) VALUES (
                    :cia, :codigo, :descri, :sueldo, :status,
                    :fecisys, :horisys, :usuisys,
                    :fecmsys, :hormsys, :usumsys
                )
            """
            )

            connection.execute(insert_query, {"cia": ciacodigo, "codigo": codigo, "descri": descri, "sueldo": sueldo, "status": status, "fecisys": fecha_pura, "horisys": hora_pura, "usuisys": sUsuario, "fecmsys": fecha_pura, "hormsys": hora_pura, "usumsys": sUsuario})

    # Ya no se usa jsonify, el decorador api_endpoint se encarga de serializar el diccionario
    return {"data": "Cargo creado exitosamente"}
