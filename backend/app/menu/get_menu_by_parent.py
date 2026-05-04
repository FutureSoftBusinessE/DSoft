# flake8: noqa
from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from app.menu import bp
from app.extensions import db
from flask_cors import cross_origin

from app.models.siacopc import Siacopc, SiacopcSchema
from app.models.siactusrweb import Siactusrweb
from services.encrip_desencrip import encriptar


# {
#     "item_number": null
# }
@bp.route("/get_menu_by_parent", methods=["POST"])
@cross_origin()
@jwt_required()
def get_menu_by_parent():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()
    cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    user = encriptar(claims["user"])
    item_number = data.get("item_number")

    item_number = None if item_number is None else item_number

    results = (
        db.session.query(
            Siacopc.opctag,
            Siacopc.opccaption,
            Siacopc.opcname,
            Siacopc.nivel,
            Siacopc.item_number,
            Siacopc.padre_id,
            Siacopc.opcmenu,
            Siacopc.opcicono,
        )
        .filter(Siacopc.padre_id == item_number)
        .join(Siactusrweb, (Siacopc.opctag == Siactusrweb.opctag) & (Siacopc.modcodigo == Siactusrweb.modcodigo))
        .filter(
            Siactusrweb.ciacodigo == cliciaciacodigo,
            Siactusrweb.usrcodigo == user,
            # Siacopc.padre_id == item_number if item_number != 0 else None,
            # Siacopc.nivel == Siacopc.nivel + 1,
            Siacopc.opcstatus == "A",
        )
        .order_by(Siacopc.item_number)
        .all()
    )
    # Siactusrweb.modcodigo == 'WEB')\

    local_schema = SiacopcSchema(many=True)
    output = local_schema.dump(results)

    return jsonify(output)
