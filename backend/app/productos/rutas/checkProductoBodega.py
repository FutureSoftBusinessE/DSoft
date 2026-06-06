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
from services.encrip_desencrip import desencriptar


@bp.route("/checkProductoBodega", methods=["POST"])
@jwt_required()
def checkProductoBodega():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    data = request.get_json()
    ciacodigo_item = data.get("ciacodigo")
    loocdigo_item = data.get("loccodigo")
    bodcodigo = data.get("bodcodigo")
    boddescri = data.get("bodega")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    data_msg = ""
    with engine.connect() as connection:
        with connection.begin():
            # Verificar que la bodega pertenezca a la compania donde el usuario hizo login
            if ciacodigo != ciacodigo_item:
                data_msg = f"No puede seleccionar ({bodcodigo}) {boddescri} ya que se encuentra en la compañia {ciacodigo_item} y usted ingresó al sistema en la compañia {ciacodigo}"
                return jsonify({"data": data_msg})

            # Si ciafacdevariosloc es 0, siginifica que esa compania no tiene permiso para tomar articulos de otras localidades
            # y si diferente de 0 significa que si puede tomar articulos de otras localidades en este caso para proformar
            query_ciafacDeVariosLoc = """
                 SELECT DISTINCT
                   ciafacDeVariosLoc
                FROM siaccia
                WHERE ciacodigo = :ciacodigo
            """
            ciafacDeVariosLoc = connection.execute(text(query_ciafacDeVariosLoc), {"ciacodigo": ciacodigo}).mappings().first()
            ciafacDeVariosLoc = ciafacDeVariosLoc["ciafacDeVariosLoc"]

            if ciafacDeVariosLoc == 0:
                if loccodigo != loocdigo_item:
                    data_msg = f"No puede seleccionar ({bodcodigo}) {boddescri} ya que se encuentra en la localidad {loocdigo_item} y usted ingresó al sistema en la localidad {loccodigo}"
                    return jsonify({"data": data_msg})

    return jsonify({"data": ""})
