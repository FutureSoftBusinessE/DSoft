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


@bp.route("/getListImages", methods=["POST"])
@cross_origin()
@jwt_required()
def getListImages():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]
    usrcodigo = encriptar(claims["user"])

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    data = request.get_json()
    artcodigo = data.get("artcodigo")

    # Query para saber si el usuario tiene permiso para agregar o editar imagenes
    sql_query = text(
        """
        SELECT usrcodigo,usrflagsup,usrflagger
        FROM siactloc
        WHERE  usrcodigo=:usrcodigo And ciacodigo=:ciacodigo And loccodigo = :loccodigo
    """
    )
    # Query para obtener todas las imagenes asociados a un articulo especifico
    sql_query_imgs = text(
        """
        SELECT artsecuen,artimagen
        FROM intimagen
        WHERE ciacodigo=:ciacodigo AND artcodigo=:artcodigo
        ORDER BY artsecuen
    """
    )
    # Ejecutar la consulta
    with engine.connect() as connection:
        result = connection.execute(sql_query, {"usrcodigo": usrcodigo, "ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchone()
        data = {"hasPermission": None, "images": []}

        if result["usrflagsup"] != 0 or result["usrflagger"] != 0:
            result2 = connection.execute(sql_query_imgs, {"ciacodigo": ciacodigo, "artcodigo": artcodigo})
            result2_dict = [dict(zip(result2.keys(), row)) for row in result2]

            data["hasPermission"] = True
            data["images"] = [
                {
                    "artsecuen": row["artsecuen"],
                    "artcodigo": artcodigo,
                    "artimagen": base64.b64encode(row["artimagen"]).decode("utf-8"),
                }
                for row in result2_dict
            ]

        else:
            data["hasPermission"] = False

    return jsonify({"data": data}), 200
