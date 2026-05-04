from flask import jsonify, request
from app.Integradora import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza una integradora
@bp.route("/editarIntegradora", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def editarIntegradora():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener el estado del sistema desde headers
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha y horas para modificación
    fecha_modif = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_modif = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    integracodigo_old = data.get("integracodigoOld")
    integracodigo_new = data.get("integracodigoNew")
    integradescri = data.get("integradescri")
    integradirecc = data.get("integradirecc")
    integrafono = data.get("integrafono")
    integrastatus = data.get("integrastatus")
    integraruc = data.get("integraruc")

    # Extraer codigo de objetos si vienen como {'codigo': 'X', 'descripcion': 'Y'}
    integraidentifica_data = data.get("integraidentifica")
    if isinstance(integraidentifica_data, dict):
        integraidentifica = integraidentifica_data.get("codigo")
    else:
        integraidentifica = integraidentifica_data

    integratipo = data.get("integratipo")

    sectorcodigo_data = data.get("sectorcodigo")
    if isinstance(sectorcodigo_data, dict):
        sectorcodigo = sectorcodigo_data.get("codigo")
    else:
        sectorcodigo = sectorcodigo_data

    if not integracodigo_old:
        raise ValidationError("Código de integradora requerido")

    if not integracodigo_new:
        raise ValidationError("Código de integradora requerido")

    if not integradescri:
        raise ValidationError("Descripción de integradora requerida")

    if not integradirecc:
        raise ValidationError("Dirección de integradora requerida")

    if not integraruc:
        raise ValidationError("RUC de integradora requerido")

    if not integraidentifica:
        raise ValidationError("Identificación de integradora requerida")

    integracodigo_old = str(integracodigo_old).strip()
    integracodigo_new = str(integracodigo_new).strip()

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
        "integrausumsys": 10,
        "integraestmsys": 50,
        "integraruc": 13,
        "integraidentifica": 1,
        "integratipo": 1,
        "sectorcodigo": 3,
    }

    if integracodigo_new and len(str(integracodigo_new)) > max_lengths["integracodigo"]:
        raise ValidationError(f"integracodigo excede {max_lengths['integracodigo']} caracteres")
    if integradescri and len(str(integradescri)) > max_lengths["integradescri"]:
        raise ValidationError(f"integradescri excede {max_lengths['integradescri']} caracteres")
    if integradirecc and len(str(integradirecc)) > max_lengths["integradirecc"]:
        raise ValidationError(f"integradirecc excede {max_lengths['integradirecc']} caracteres")
    if integrafono and len(str(integrafono)) > max_lengths["integrafono"]:
        raise ValidationError(f"integrafono excede {max_lengths['integrafono']} caracteres")
    if integrastatus and len(str(integrastatus)) > max_lengths["integrastatus"]:
        raise ValidationError(f"integrastatus excede {max_lengths['integrastatus']} caracteres")
    if integraruc and len(str(integraruc)) > max_lengths["integraruc"]:
        raise ValidationError(f"integraruc excede {max_lengths['integraruc']} caracteres")
    if integraidentifica and len(str(integraidentifica)) > max_lengths["integraidentifica"]:
        raise ValidationError(f"integraidentifica excede {max_lengths['integraidentifica']} caracteres")
    if integratipo and len(str(integratipo)) > max_lengths["integratipo"]:
        raise ValidationError(f"integratipo excede {max_lengths['integratipo']} caracteres")
    if sectorcodigo and len(str(sectorcodigo)) > max_lengths["sectorcodigo"]:
        raise ValidationError(f"sectorcodigo excede {max_lengths['sectorcodigo']} caracteres")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_fabintegra_update = {
                "integracodigoOld": integracodigo_old,
                "integradescri": integradescri,
                "integradirecc": integradirecc,
                "integrafono": integrafono,
                "integrastatus": integrastatus,
                "integrafecmsys": fecha_modif,
                "integrahormsys": hora_modif,
                "integrausumsys": sUsuario,
                "integraestmsys": sNomEst,
                "integraruc": integraruc,
                "integraidentifica": integraidentifica,
                "integratipo": integratipo,
                "sectorcodigo": sectorcodigo,
            }

            update_query = text(
                """
                UPDATE fabintegra
                SET integradescri = :integradescri,
                    integradirecc = :integradirecc,
                    integrafono = :integrafono,
                    integrastatus = :integrastatus,
                    integrafecmsys = :integrafecmsys,
                    integrahormsys = :integrahormsys,
                    integrausumsys = :integrausumsys,
                    integraestmsys = :integraestmsys,
                    integraruc = :integraruc,
                    integraidentifica = :integraidentifica,
                    integratipo = :integratipo,
                    sectorcodigo = :sectorcodigo
                WHERE integracodigo = :integracodigoOld
            """
            )

            try:
                connection.execute(update_query, data_fabintegra_update)
            except IntegrityError:
                raise ValidationError("No se puede editar la integradora porque existen registros relacionados")

    return {"data": "Integradora actualizada exitosamente"}
