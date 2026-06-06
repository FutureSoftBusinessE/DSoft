from flask import jsonify, request
from app.productos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
import base64


@bp.route("/addNewImage", methods=["POST"])
@jwt_required()
def addNewImage():

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
    # Eliminar el prefijo "data:image/jpeg;base64," si está presente
    if "," in artimagen:
        artimagen = artimagen.split(",")[1]

    # Decodificar la imagen de Base64 a binario
    imagen_binaria = base64.b64decode(artimagen)

    # Query para obtener el total de imagenes asociadas a ese articulo
    sql_total_imgs = text(
        """
        SELECT COUNT(*) AS total FROM intimagen
         WHERE ciacodigo=:ciacodigo AND artcodigo=:artcodigo
    """
    )

    # Query para agregar una nueva imagen
    sql_insert_image = text(
        """
        INSERT INTO intimagen (
        ciacodigo,
        invcodigo,
        artcodigo,
        artsecuen,
        artimagen,
        artfecmsys,
        arthormsys,
        artestmsys,
        artusumsys
        )
        VALUES (
        :ciacodigo,
        :invcodigo,
        :artcodigo,
        :artsecuen,
        :artimagen,
        :artfecmsys,
        :arthormsys,
        :artestmsys,
        :artusumsys)
    """
    )
    # Ejecutar la consulta
    with engine.connect() as connection:
        try:
            # Ejecutar la consulta para obtener el total de imágenes
            result = connection.execute(sql_total_imgs, {"ciacodigo": ciacodigo, "artcodigo": artcodigo}).mappings().fetchone()

            # Verificar si result no es None
            if result is None:
                raise ValueError("No se encontraron imágenes para el artículo.")

            # Obtener el total de imágenes
            total_imagenes = result["total"]
            # Establecer artsecuen sumando 1 al total obtenido
            artsecuen = total_imagenes + 1
            # Ejecutar la consulta para insertar una nueva imagen
            connection.execute(
                sql_insert_image,
                {
                    "ciacodigo": ciacodigo,
                    "invcodigo": invcodigo,
                    "artcodigo": artcodigo,
                    "artsecuen": artsecuen,
                    "artimagen": imagen_binaria,
                    "artfecmsys": artfecmsys,
                    "arthormsys": arthormsys,
                    "artestmsys": ipUser,
                    "artusumsys": usrcodigo,
                },
            )
            # Confirmar la transacción
            connection.commit()
            print("Imagen insertada con éxito.")
        except Exception as e:
            # Manejo de errores
            print(f"Ocurrió un error: {e}")
            connection.rollback()  # Revertir cambios en caso de error
    return jsonify({"data": "ok"}), 200
