from flask import jsonify, request
from app.Integradora import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api crea una integradora
@bp.route("/crearIntegradora", methods=["POST"])
@jwt_required()
@api_endpoint
def crearIntegradora():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener el estado del sistema desde headers
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json() or {}
    integracodigo = data.get("integracodigo")
    integradescri = data.get("integradescri")
    integradirecc = data.get("integradirecc")
    integrafono = data.get("integrafono")
    integrastatus = data.get("integrastatus", "A")
    integraruc = data.get("integraruc")

    # Extraer codigo de objetos si vienen como {'codigo': 'X', 'descripcion': 'Y'}
    integraidentifica_data = data.get("integraidentifica")
    if isinstance(integraidentifica_data, dict):
        integraidentifica = integraidentifica_data.get("codigo")
    else:
        integraidentifica = integraidentifica_data

    integratipo = data.get("integratipo", "I")

    sectorcodigo_data = data.get("sectorcodigo")
    if isinstance(sectorcodigo_data, dict):
        sectorcodigo = sectorcodigo_data.get("codigo")
    else:
        sectorcodigo = sectorcodigo_data

    if integracodigo is None or integracodigo.strip() == "":
        raise ValidationError("Código de integradora requerido")

    if integradescri is None or integradescri.strip() == "":
        raise ValidationError("Descripción de integradora requerida")

    if integradirecc is None or integradirecc.strip() == "":
        raise ValidationError("Dirección de integradora requerida")

    if integraruc is None or integraruc.strip() == "":
        raise ValidationError("RUC de integradora requerido")

    if integraidentifica is None or (isinstance(integraidentifica, str) and integraidentifica.strip() == "") or (isinstance(integraidentifica, dict) and not integraidentifica.get("codigo")):
        raise ValidationError("Identificación de integradora requerida")

    integracodigo = str(integracodigo).strip()
    integradescri = str(integradescri).strip()
    integradirecc = str(integradirecc).strip()
    integraruc = str(integraruc).strip()
    if integraidentifica:
        integraidentifica = str(integraidentifica).strip()

    # Validaciones de tamaño según esquema
    max_lengths = {
        "integracodigo": 3,
        "integradescri": 60,
        "integradirecc": 100,
        "integrafono": 30,
        "integrastatus": 1,
        "integrausuisys": 10,
        "integraestisys": 50,
        "integraruc": 13,
        "integraidentifica": 1,
        "integratipo": 1,
        "sectorcodigo": 3,
    }

    if len(integradescri) > max_lengths["integradescri"]:
        raise ValidationError(f"integradescri excede {max_lengths['integradescri']} caracteres")
    if len(integradirecc) > max_lengths["integradirecc"]:
        raise ValidationError(f"integradirecc excede {max_lengths['integradirecc']} caracteres")
    if integrafono and len(str(integrafono)) > max_lengths["integrafono"]:
        raise ValidationError(f"integrafono excede {max_lengths['integrafono']} caracteres")
    if integrastatus and len(str(integrastatus)) > max_lengths["integrastatus"]:
        raise ValidationError(f"integrastatus excede {max_lengths['integrastatus']} caracteres")
    if sUsuario and len(str(sUsuario)) > max_lengths["integrausuisys"]:
        raise ValidationError(f"integrausuisys (usuario) excede {max_lengths['integrausuisys']} caracteres")
    if len(integraruc) > max_lengths["integraruc"]:
        raise ValidationError(f"integraruc excede {max_lengths['integraruc']} caracteres")
    if len(integraidentifica) > max_lengths["integraidentifica"]:
        raise ValidationError(f"integraidentifica excede {max_lengths['integraidentifica']} caracteres")
    if integratipo and len(str(integratipo)) > max_lengths["integratipo"]:
        raise ValidationError(f"integratipo excede {max_lengths['integratipo']} caracteres")
    if sectorcodigo and len(str(sectorcodigo)) > max_lengths["sectorcodigo"]:
        raise ValidationError(f"sectorcodigo excede {max_lengths['sectorcodigo']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            query_codes = text("SELECT integracodigo FROM fabintegra")
            rows = connection.execute(query_codes).mappings().fetchall()

            numeric_codes = [int(str(row.get("integracodigo", "")).strip()) for row in rows if str(row.get("integracodigo", "")).strip().isdigit()]

            next_code = (max(numeric_codes) + 1) if numeric_codes else 1

            if next_code > 999:
                raise ValidationError("No se puede generar más códigos de integradora")

            integracodigo = str(next_code)

            data_fabintegra = {
                "integracodigo": integracodigo,
                "integradescri": integradescri,
                "integradirecc": integradirecc,
                "integrafono": integrafono,
                "integrastatus": integrastatus,
                "integrafecisys": fecha_actual,
                "integrahorisys": hora_sys,
                "integrausuisys": sUsuario,
                "integraestisys": sNomEst,
                "integrafecmsys": fecha_actual,
                "integrahormsys": hora_sys,
                "integrausumsys": sUsuario,
                "integraestmsys": sNomEst,
                "integraruc": integraruc,
                "integraidentifica": integraidentifica,
                "integratipo": integratipo,
                "sectorcodigo": sectorcodigo,
            }

            insert_query = text(
                """
                INSERT INTO fabintegra (
                    integracodigo, integradescri, integradirecc, integrafono, integrastatus,
                    integrafecisys, integrahorisys, integrausuisys, integraestisys,
                    integrafecmsys, integrahormsys, integrausumsys, integraestmsys,
                    integraruc, integraidentifica, integratipo, sectorcodigo
                ) VALUES (
                    :integracodigo, :integradescri, :integradirecc, :integrafono, :integrastatus,
                    :integrafecisys, :integrahorisys, :integrausuisys, :integraestisys,
                    :integrafecmsys, :integrahormsys, :integrausumsys, :integraestmsys,
                    :integraruc, :integraidentifica, :integratipo, :sectorcodigo
                )
            """
            )

            connection.execute(insert_query, data_fabintegra)

    return {"data": "Integradora creada exitosamente"}
