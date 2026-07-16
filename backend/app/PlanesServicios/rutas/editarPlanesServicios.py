from flask import jsonify, request
from app.PlanesServicios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from error_handling import api_endpoint, ValidationError


# Esta api actualiza un plan de servicios
@bp.route("/editarPlanesServicios", methods=["POST"])
@jwt_required()
@api_endpoint
def editarPlanesServicios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now()
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()
    invcodigoOld = data.get("invcodigoOld")
    artcodigoOld = data.get("artcodigoOld")
    artdescriNew = data.get("artdescriNew")
    artprecventa1New = data.get("artprecventa1New")
    artaplivaNew = data.get("artaplivaNew")  # Ahora recibe código string ("01", "02", etc.)
    artstatus = data.get("artstatus")

    if not invcodigoOld or not artcodigoOld:
        raise ValidationError("Claves primarias requeridas")

    if artdescriNew is not None and artdescriNew.strip() != "":
        if len(artdescriNew) > 250:
            raise ValidationError("Descripción excede 250 caracteres")

    if artprecventa1New is not None:
        try:
            artprecventa1New = float(artprecventa1New)
            if artprecventa1New <= 0:
                raise ValueError("El precio debe ser mayor a 0")
        except (ValueError, TypeError):
            raise ValidationError("El precio debe ser un número válido y mayor a 0")

    # MODIFICADO: Validar y convertir artapliiva
    if artaplivaNew is not None:
        # Primero obtener la sesión para validar contra siacsritarifaiva
        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # Verificar que la tarifa existe y está disponible
            query_tarifa = text(
                """
                SELECT codigo
                FROM siacsritarifaiva
                WHERE codigo = :codigo AND disponible = 1
            """
            )
            result_tarifa = connection.execute(query_tarifa, {"codigo": str(artaplivaNew)}).fetchone()

            if not result_tarifa:
                raise ValidationError("La tarifa de IVA seleccionada no existe o no está disponible")

        # Convertir el código a INT para guardar en inmart
        try:
            artaplivaNew = int(str(artaplivaNew))
        except (ValueError, TypeError):
            raise ValidationError("El código de tarifa IVA debe ser un valor numérico válido")

    if artstatus is not None:
        if artstatus not in ["A", "I"]:
            raise ValidationError("El estado debe ser 'A' (Activo) o 'I' (Inactivo)")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            # Actualizo el Registro
            data_inmart_update = {
                "ciacodigo": sCodCia,
                "invcodigoOld": invcodigoOld,
                "artcodigoOld": artcodigoOld,
                "artdescriNew": artdescriNew,
                "artprecventa1New": artprecventa1New,
                "artaplivaNew": artaplivaNew,  # MODIFICADO: Ahora es INT
                "artstatus": artstatus,
                "artfecmsys": fecha_actual,
                "arthormsys": hora_sys,
                "artusumsys": sUsuario,
            }

            update_query = text(
                """
                UPDATE inmart SET
                    artdescri = :artdescriNew,
                    artprecventa1 = :artprecventa1New,
                    artapliiva = :artaplivaNew,
                    artstatus = :artstatus,
                    artfecmsys = :artfecmsys,
                    arthormsys = :arthormsys,
                    artusumsys = :artusumsys
                WHERE ciacodigo = :ciacodigo AND invcodigo = :invcodigoOld AND artcodigo = :artcodigoOld
            """
            )

            try:
                connection.execute(update_query, data_inmart_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el Plan de servicios porque existen registros relacionados")

    return {"data": "Plan de servicios actualizado exitosamente"}
