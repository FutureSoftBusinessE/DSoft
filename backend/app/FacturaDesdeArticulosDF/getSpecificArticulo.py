from flask import jsonify, request
from app.FacturaDesdeArticulosDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import bindparam, text
from app.db import get_session
from services.encrip_desencrip import encriptar
from app.models.DynamicLoginDB import DynamicLoginDB
from datetime import datetime
import base64


@bp.route("/getSpecificArticulo/<string:codigo_articulo>", methods=["GET"])
@jwt_required()
def getSpecificArticulo(codigo_articulo):
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as session:
            sQl_Iva = """
                select sysiva from siacSys
            """

            resultIva = session.execute(text(sQl_Iva)).mappings().first()
            iva = resultIva["sysiva"] if resultIva else None

            sQl_Info = """
                   SELECT artdescri, artcodigo, artprecventa1, meddescri,
                    predescri, lindescri, artcantactual, artapliiva, mardescri
                    FROM view_inmart
                     WHERE (artcodigo LIKE :codigo_articulo OR artdescri LIKE :codigo_articulo)
                    AND ciacodigo = :ciacodigo
            """

            codigo_articulo = f"%{codigo_articulo}%"
            params = {"codigo_articulo": codigo_articulo, "ciacodigo": ciacodigo}

            result = session.execute(text(sQl_Info), params).mappings().all()

            data = [dict(row) for row in result]

            sQlImagen = """
                Select artcodigo, ciacodigo, artimagen
                from intimagen
                where ciacodigo = :ciacodigo
                and artcodigo = :codigo_articulo
            """

            for row in data:
                # Cambiar "codigo_articulo" a "artcodigo" para que coincida con la columna devuelta
                params = {"ciacodigo": ciacodigo, "codigo_articulo": row["artcodigo"]}
                resultImagen = session.execute(text(sQlImagen), params).mappings().first()

                # Convertir la imagen a base64 si está disponible y asignarla a la propiedad "imagen"
                row["imagen"] = [(base64.b64encode(resultImagen["artimagen"]).decode("utf-8").replace("\n", "") if resultImagen and resultImagen["artimagen"] else None)]

                # Agregar el valor de sysiva al artículo
                row["sysiva"] = iva if iva else None

            response = {"data": data}
            return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
