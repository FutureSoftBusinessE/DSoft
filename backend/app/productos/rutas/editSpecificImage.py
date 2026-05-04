from flask import jsonify, request
from app.productos import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
import base64
from sqlalchemy.exc import SQLAlchemyError


@bp.route("/editSpecificImage", methods=["POST"])
@cross_origin()
@jwt_required()
def editSpecificImage():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    # loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = claims["user"]
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Fecha actual con tiempo en 00:00:00
    artfecmsys = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Hora actual con la fecha 1900-01-01
    arthormsys = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    data = request.get_json()
    artcodigo = data.get("artcodigo")
    invcodigo = data.get("invcodigo")
    artimagen = data.get("artimagen")
    artsecuen = data.get("artsecuen")
    # Eliminar el prefijo "data:image/jpeg;base64," si está presente
    if "," in artimagen:
        artimagen = artimagen.split(",")[1]

    # Decodificar la imagen de Base64 a binario
    imagen_binaria = base64.b64decode(artimagen)

    # Consulta para actualizar el registro
    sql_update_image = text(
        """
        UPDATE intimagen
        SET
            artimagen = :artimagen,
            artfecmsys = :artfecmsys,
            arthormsys = :arthormsys,
            artestmsys = :artestmsys,
            artusumsys = :artusumsys
        WHERE
            ciacodigo = :ciacodigo AND
            artcodigo = :artcodigo AND
            invcodigo = :invcodigo AND
            artsecuen = :artsecuen
    """
    )
    # Ejecutar la consulta
    # Manejo de transacción con rollback en caso de error
    try:
        with engine.begin() as connection:  # Esto asegura un commit automático si no hay errores
            connection.execute(
                sql_update_image,
                {
                    "artimagen": imagen_binaria,  # Imagen en formato binario
                    "artfecmsys": artfecmsys,  # Fecha actual con hora en 00:00:00
                    "arthormsys": arthormsys,  # Fecha 1900-01-01 con la hora actual
                    "artestmsys": ipUser,  # Reemplaza con el valor adecuado
                    "artusumsys": usrcodigo,  # Reemplaza con el valor adecuado
                    "ciacodigo": ciacodigo,
                    "artcodigo": artcodigo,  # Filtro WHERE
                    "invcodigo": invcodigo,  # Filtro WHERE
                    "artsecuen": artsecuen,  # Filtro WHERE
                },
            )

    except SQLAlchemyError as e:
        # Si ocurre un error, se realiza el rollback automáticamente
        print(f"Ocurrió un error: {str(e)}")
        # Maneja el error o devuelve un mensaje de error adecuado
    return jsonify({"data": "ok"}), 200
