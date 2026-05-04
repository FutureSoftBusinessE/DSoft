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


@bp.route("/deleteSpecificImage", methods=["POST"])
@cross_origin()
@jwt_required()
def deleteSpecificImage():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    # loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    data = request.get_json()
    artcodigo = data.get("artcodigo")
    invcodigo = data.get("invcodigo")
    artsecuen = data.get("artsecuen")

    # Consulta para eliminar el registro
    sql_delete_image = text(
        """
        DELETE FROM intimagen
        WHERE
            ciacodigo = :ciacodigo AND
            artcodigo = :artcodigo AND
            invcodigo = :invcodigo AND
            artsecuen = :artsecuen
    """
    )
    # Consulta para obtener todos los registros que cumplen con los filtros, ordenados por artsecuen
    sql_select_images = text(
        """
        SELECT artsecuen FROM intimagen
        WHERE
            ciacodigo = :ciacodigo AND
            artcodigo = :artcodigo AND
            invcodigo = :invcodigo
        ORDER BY artsecuen
    """
    )
    # Consulta para actualizar el artsecuen
    sql_update_secuen = text(
        """
        UPDATE intimagen
        SET artsecuen = :new_artsecuen
        WHERE
            ciacodigo = :ciacodigo AND
            artcodigo = :artcodigo AND
            invcodigo = :invcodigo AND
            artsecuen = :old_artsecuen
    """
    )

    # Manejo de transacción con rollback en caso de error
    try:
        with engine.begin() as connection:  # Esto asegura un commit automático si no hay errores
            # 1. Eliminar el registro específico
            connection.execute(
                sql_delete_image,
                {
                    "ciacodigo": ciacodigo,  # Filtro WHERE
                    "artcodigo": artcodigo,  # Filtro WHERE
                    "invcodigo": invcodigo,  # Filtro WHERE
                    "artsecuen": artsecuen,  # Filtro WHERE
                },
            )

            # 2. Recuperar todos los registros que cumplen con los filtros
            result = (
                connection.execute(
                    sql_select_images,
                    {
                        "ciacodigo": ciacodigo,
                        "artcodigo": artcodigo,
                        "invcodigo": invcodigo,
                    },
                )
                .mappings()
                .fetchall()
            )

            # 3. Actualizar el artsecuen de los registros
            for new_artsecuen, row in enumerate(result, start=1):
                old_artsecuen = row["artsecuen"]  # Accede correctamente al valor
                print([new_artsecuen, old_artsecuen])
                connection.execute(
                    sql_update_secuen,
                    {
                        "new_artsecuen": new_artsecuen,
                        "ciacodigo": ciacodigo,
                        "artcodigo": artcodigo,
                        "invcodigo": invcodigo,
                        "old_artsecuen": old_artsecuen,
                    },
                )

    except SQLAlchemyError as e:
        # Si ocurre un error, se realiza el rollback automáticamente
        print(f"Ocurrió un error: {str(e)}")
        # Maneja el error o devuelve un mensaje de error adecuado
    return jsonify({"data": "ok"}), 200
