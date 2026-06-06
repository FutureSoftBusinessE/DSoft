from flask import jsonify, request
from app.ImpuestosRetenciones import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea un impuesto/retención
@bp.route("/crearImpuestosRetenciones", methods=["POST"])
@jwt_required()
@api_endpoint
def crearImpuestosRetenciones():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    impid = data.get("impid") or ""
    impdescri = data.get("impdescri")
    impctanor = data.get("impctanor")
    impporcent = data.get("impporcent", 0)
    impesiva = data.get("impesiva")
    impaplica = data.get("impaplica")
    impstatus = data.get("impstatus", "A")
    impretimp = data.get("impretimp")
    codsri = data.get("codSRI") or ""
    dessri = data.get("desSRI") or ""
    impbienser = data.get("impbienser")

    if impdescri is None or impdescri.strip() == "":
        raise ValidationError("Descripción del impuesto/retención requerida")

    if not impid or impid.strip() == "":
        raise ValidationError("Código del impuesto/retención requerido")

    impid = str(impid).strip()
    impdescri = str(impdescri).strip()
    impctanor = str(impctanor).strip() if impctanor else ""
    codsri = str(codsri).strip() if codsri else ""
    dessri = str(dessri).strip() if dessri else ""

    # Validaciones de tamaño según esquema
    max_lengths = {
        "impid": 3,
        "impdescri": 40,
        "impctanor": 30,
        "impctadol": 30,
        "impstatus": 1,
        "impretimp": 1,
        "impesiva": 1,
        "impaplica": 1,
        "impbienser": 1,
        "codsri": 5,
        "dessri": 60,
        "impususys": 10,
    }

    if len(impid) > max_lengths["impid"]:
        raise ValidationError(f"impid excede {max_lengths['impid']} caracteres")
    if len(impdescri) > max_lengths["impdescri"]:
        raise ValidationError(f"impdescri excede {max_lengths['impdescri']} caracteres")
    if impctanor and len(impctanor) > max_lengths["impctanor"]:
        raise ValidationError(f"impctanor excede {max_lengths['impctanor']} caracteres")
    if impstatus and len(str(impstatus)) > max_lengths["impstatus"]:
        raise ValidationError(f"impstatus excede {max_lengths['impstatus']} caracteres")
    if sUsuario and len(str(sUsuario)) > max_lengths["impususys"]:
        raise ValidationError(f"impususys (usuario) excede {max_lengths['impususys']} caracteres")

    # Validación de impporcent
    try:
        impporcent_val = float(impporcent) if impporcent else 0
        if impporcent_val < 0:
            raise ValidationError("Porcentaje que Aplica no puede ser negativo")
    except (ValueError, TypeError):
        raise ValidationError("Porcentaje que Aplica debe ser un número válido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_cxpbimp = {
                "ciacodigo": sCodCia,
                "impid": impid,
                "impdescri": impdescri,
                "impctanor": impctanor,
                "impctadol": impctanor,
                "impporcent": impporcent,
                "impesiva": impesiva,
                "impaplica": impaplica,
                "impstatus": impstatus,
                "impretimp": impretimp,
                "codSRI": codsri,
                "desSRI": dessri,
                "impbienser": impbienser,
                "impfecisys": fecha_actual,
                "imphorisys": hora_sys,
                "impusuisys": sUsuario,
                "impfecmsys": fecha_actual,
                "imphormsys": hora_sys,
                "impusumsys": sUsuario,
            }

            data_getAll = {
                "impid": impid,
                "ciacodigo": sCodCia,
            }
            getAll = text("SELECT impid FROM cxpbimp WHERE ciacodigo = :ciacodigo AND impid = :impid")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("Impuesto/Retención ya existe")

            insert_query = text(
                """
                INSERT INTO cxpbimp (
                    ciacodigo, impid, impdescri, impctadol, impctanor, impporcent, impesiva,
                    impaplica, impstatus, impretimp, codSRI, desSRI, impbienser,
                    impfecisys, imphorisys, impusuisys,
                    impfecmsys, imphormsys, impusumsys
                ) VALUES (
                    :ciacodigo, :impid, :impdescri, :impctadol, :impctanor, :impporcent, :impesiva,
                    :impaplica, :impstatus, :impretimp, :codSRI, :desSRI, :impbienser,
                    :impfecisys, :imphorisys, :impusuisys,
                    :impfecmsys, :imphormsys, :impusumsys
                )
            """
            )

            connection.execute(insert_query, data_cxpbimp)

    return {"data": "Impuesto/Retención creado exitosamente"}
