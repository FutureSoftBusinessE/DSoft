from flask import jsonify, request
from app.ImpuestosRetenciones import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza un impuesto/retención
@bp.route("/editarImpuestosRetenciones", methods=["POST"])
@jwt_required()
@api_endpoint
def editarImpuestosRetenciones():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    impid_old = data.get("impidOld")
    impdescri = data.get("impdescri")
    impctanor = data.get("impctanor")
    impporcent = data.get("impporcent")
    impesiva = data.get("impesiva")
    impaplica = data.get("impaplica")
    impstatus = data.get("impstatus")
    impretimp = data.get("impretimp")
    codsri = data.get("codSRI") or ""
    dessri = data.get("desSRI") or ""
    impbienser = data.get("impbienser")

    if not impdescri or impdescri.strip() == "":
        raise ValidationError("Descripción del impuesto/retención requerida")

    impdescri = str(impdescri).strip()
    impctanor = str(impctanor).strip() if impctanor else ""
    codsri = str(codsri).strip() if codsri else ""
    dessri = str(dessri).strip() if dessri else ""

    # Validaciones de tamaño
    max_lengths = {
        "impid": 3,
        "impdescri": 40,
        "impctanor": 30,
        "impstatus": 1,
        "impretimp": 1,
        "impesiva": 1,
        "impaplica": 1,
        "impbienser": 1,
        "codsri": 5,
        "dessri": 60,
    }

    if len(impdescri) > max_lengths["impdescri"]:
        raise ValidationError(f"impdescri excede {max_lengths['impdescri']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # Verificar que existe el registro
                check_query = text("SELECT impid FROM cxpbimp WHERE ciacodigo = :ciacodigo AND impid = :impid")
                result = connection.execute(check_query, {"ciacodigo": sCodCia, "impid": impid_old}).mappings().fetchone()
                if not result:
                    raise ValidationError("Impuesto/Retención no encontrado")

                update_query = text(
                    """
                    UPDATE cxpbimp
                    SET impdescri = :impdescri,
                        impctadol = :impctadol,
                        impctanor = :impctanor,
                        impporcent = :impporcent,
                        impesiva = :impesiva,
                        impaplica = :impaplica,
                        impstatus = :impstatus,
                        impretimp = :impretimp,
                        codSRI = :codSRI,
                        desSRI = :desSRI,
                        impbienser = :impbienser,
                        impfecmsys = :impfecmsys,
                        imphormsys = :imphormsys,
                        impusumsys = :impusumsys
                    WHERE ciacodigo = :ciacodigo AND impid = :impid_old
                """
                )

                connection.execute(
                    update_query,
                    {
                        "impdescri": impdescri,
                        "impctadol": impctanor,
                        "impctanor": impctanor,
                        "impporcent": impporcent,
                        "impesiva": impesiva,
                        "impaplica": impaplica,
                        "impstatus": impstatus,
                        "impretimp": impretimp,
                        "codSRI": codsri,
                        "desSRI": dessri,
                        "impbienser": impbienser,
                        "impfecmsys": fecha_actual,
                        "imphormsys": hora_sys,
                        "impusumsys": sUsuario,
                        "ciacodigo": sCodCia,
                        "impid_old": impid_old,
                    },
                )

        return {"data": "Impuesto/Retención actualizado exitosamente"}

    except IntegrityError as e:
        raise ValidationError(f"Error de integridad: {str(e)}")
