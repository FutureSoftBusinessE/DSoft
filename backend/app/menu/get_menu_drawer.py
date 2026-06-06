# flake8: noqa
from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text, func, cast, VARCHAR
import json
from app.menu.utils.build_tree import build_tree
from app.menu import bp
from app.extensions import db


from app.models.siacopc import Siacopc, SiacopcSchema
from app.models.siactusrweb import Siactusrweb
from services.encrip_desencrip import encriptar
from app.db import get_session


# {
#     "deep": 2
# }
@bp.route("/get_menu_drawer", methods=["POST"])
@jwt_required()
def get_menu_drawer():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()

    cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    user = claims["user"]
    user = encriptar(user)

    deep = data.get("deep")

    results = (
        db.session.query(
            Siacopc.opctag,
            Siacopc.opccaption,
            Siacopc.opcname,
            Siacopc.opcicono,
            Siacopc.nivel,
            Siacopc.item_number,
            Siacopc.padre_id,
            Siacopc.opcmenu,
            Siacopc.opchijo,
        )
        .filter(
            # Siacopc.padre_id == item_number,
            Siacopc.nivel
            <= deep
        )
        .join(Siactusrweb, (Siacopc.opctag == Siactusrweb.opctag) & (Siacopc.modcodigo == Siactusrweb.modcodigo))
        .filter(
            Siactusrweb.ciacodigo == cliciaciacodigo,
            Siactusrweb.usrcodigo == user,
        )
        .order_by(Siacopc.nivel)
        .all()
    )

    local_schema = SiacopcSchema(many=True)
    output = local_schema.dump(results)

    objetos = output
    tree = {"items": build_tree(objetos)}

    return jsonify(tree)


@bp.route("/get_menu_all", methods=["GET"])
@jwt_required()
def get_menu_all():
    data = request.get_json() if request.is_json else None
    claims = get_jwt()

    clicianonBD = claims["seleccion"]["clicianonBD"]
    cliciaciacodigo = claims["seleccion"]["cliciaciacodigo"]
    user = claims["user"]
    user = encriptar(user)

    db.session = get_session(clicianonBD)

    # ObtÃ©n los resultados de la consulta SQL
    results = (
        db.session.query(
            Siacopc.opctag,
            Siacopc.opccaption,
            Siacopc.opcname,
            Siacopc.opcicono,
            Siacopc.nivel,
            Siacopc.item_number,
            Siacopc.padre_id,
            Siacopc.opcmenu,
            Siacopc.opchijo,
            Siacopc.opccontroller,
        )
        .join(Siactusrweb, (Siacopc.opctag == Siactusrweb.opctag) & (Siacopc.modcodigo == Siactusrweb.modcodigo))
        .filter(Siactusrweb.ciacodigo == cliciaciacodigo, Siactusrweb.usrcodigo == user, Siacopc.opcstatus == "A")
        .order_by(Siacopc.item_number)
        .all()
    )

    print(results)

    local_schema = SiacopcSchema(many=True)
    output = local_schema.dump(results)

    objetos = output
    tree = {"items": build_tree(objetos)}

    # # Llama a la función para generar el JSON del menÃº
    # menu_data = build_tree(results)

    # # Imprime el JSON generado
    # import json
    # print(json.dumps(menu_data, indent=2))

    return jsonify(tree), 200
