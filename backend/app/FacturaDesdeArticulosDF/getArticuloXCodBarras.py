# flake8: noqa
import base64
from flask_jwt_extended import get_jwt, jwt_required
from app.models.intart import Intart
from app.models.viewProductos import ViewProducto
from flask import jsonify, request
from sqlalchemy import and_, func, or_, text
from app.FacturaDesdeArticulosDF import bp
from app.extensions import db
from flask_cors import cross_origin

from app.models.intimagen import intimagen
from app.utils import paginate
from app.db import get_session
from app.models.SiacSys import SiacSys, SiacSysSchema


@bp.route("/getArticuloXCodBarras/<string:codigo_articulo>", methods=["GET"])
@cross_origin()
@jwt_required()
def getArticuloXCodBarras(codigo_articulo):
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as session:
            sQl_Barra = """
                select artcodigo from intartbarras where artcodbarra = :codigo_articulo
            """
            params = {"codigo_articulo": codigo_articulo}
            result = session.execute(text(sQl_Barra), params).mappings().first()
            codigoArticulo = result["artcodigo"] if result else None

            sQl_Info = """
                Select artdescri, artcodigo, artprecventa1, meddescri,
                predescri, lindescri, artcantactual, artapliiva, mardescri
                FROM view_inmart
                WHERE artcodigo = :codigoArticulo
                AND ciacodigo = :ciacodigo
            """

            params = {"ciacodigo": ciacodigo, "codigoArticulo": codigoArticulo}

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

            response = {"data": data}
            return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
