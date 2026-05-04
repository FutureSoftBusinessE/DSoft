from flask import jsonify, request
from app.TipoDocumento import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea un tipo de documento
@bp.route("/crearTipoDocumento", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def crearTipoDocumento():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas
    fecha_actual = datetime.now()

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    tipdoccodigo = data.get("tipdoccodigo") or ""
    tipdocdescri = data.get("tipdocdescri")
    tipdocstatus = data.get("tipdocstatus", "A")

    if not tipdocdescri or not str(tipdocdescri).strip():
        raise ValidationError("Descripción de tipo de documento requerida")

    # Auto-generar código si no se proporciona
    if not tipdoccodigo or not str(tipdoccodigo).strip():
        db.session = get_session(clicianonBD)
        engine = db.session.bind
        with engine.connect() as connection:
            with connection.begin():
                query = text("SELECT tipdoccodigo FROM gdocbtipodoc WHERE ciacodigo = :ciacodigo")
                rows = connection.execute(query, {"ciacodigo": sCodCia}).mappings().fetchall()
                numeric_codes = [int(str(row.get("tipdoccodigo", "")).strip()) for row in rows if str(row.get("tipdoccodigo", "")).strip().isdigit()]
                next_code = (max(numeric_codes) + 1) if numeric_codes else 1
                if next_code > 999:
                    raise ValidationError("No se puede generar más códigos de tipo de documento (máximo 999)")
                tipdoccodigo = str(next_code).zfill(3)

    tipdoccodigo = str(tipdoccodigo).strip()
    tipdocdescri = str(tipdocdescri).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "ciacodigo": 2,
        "tipdoccodigo": 3,
        "tipdocdescri": 60,
        "tipdocstatus": 1,
        "tipdocusuisys": 10,
        "tipdocestisys": 40,
        "tipdocusumsys": 10,
        "tipdocestmsys": 40,
    }

    if len(tipdoccodigo) > max_lengths["tipdoccodigo"]:
        raise ValidationError(f"tipdoccodigo excede {max_lengths['tipdoccodigo']} caracteres")
    if len(tipdocdescri) > max_lengths["tipdocdescri"]:
        raise ValidationError(f"tipdocdescri excede {max_lengths['tipdocdescri']} caracteres")
    if tipdocstatus and len(str(tipdocstatus)) > max_lengths["tipdocstatus"]:
        raise ValidationError(f"tipdocstatus excede {max_lengths['tipdocstatus']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_gdocbtipodoc = {
                "ciacodigo": sCodCia,
                "tipdoccodigo": tipdoccodigo,
                "tipdocdescri": tipdocdescri,
                "tipdocstatus": tipdocstatus,
                "tipdocfechorisys": fecha_actual,
                "tipdocusuisys": sUsuario,
                "tipdocestisys": sNomEst,
                "tipdocfechormsys": fecha_actual,
                "tipdocusumsys": sUsuario,
                "tipdocestmsys": sNomEst,
            }

            data_get = {"tipdoccodigo": tipdoccodigo}
            getOne = text("SELECT tipdoccodigo FROM gdocbtipodoc WHERE ciacodigo = :ciacodigo AND tipdoccodigo = :tipdoccodigo")
            result = connection.execute(getOne, {"ciacodigo": sCodCia, **data_get}).mappings().fetchone()
            if result:
                raise ValidationError("Tipo de documento ya existe")

            insert_query = text(
                """
                INSERT INTO gdocbtipodoc (
                    ciacodigo, tipdoccodigo, tipdocdescri, tipdocstatus,
                    tipdocfechorisys, tipdocusuisys, tipdocestisys,
                    tipdocfechormsys, tipdocusumsys, tipdocestmsys
                ) VALUES (
                    :ciacodigo, :tipdoccodigo, :tipdocdescri, :tipdocstatus,
                    :tipdocfechorisys, :tipdocusuisys, :tipdocestisys,
                    :tipdocfechormsys, :tipdocusumsys, :tipdocestmsys
                )
            """
            )

            connection.execute(insert_query, data_gdocbtipodoc)

    return {"data": "Tipo de documento creado exitosamente"}
