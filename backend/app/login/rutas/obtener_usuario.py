# flake8: noqa
from flask import jsonify, request
from app.login import bp
from app.extensions import db

from services.encrip_desencrip import encriptar, desencriptar

from app.models.usuario import Usuario, UsuarioSchema


@bp.route("/obtener_usuario", methods=["POST"])
def obtener_usuario():
    data = request.get_json() if request.is_json else None

    codigo = data.get("usrcodigo")
    clave = data.get("usrclave")
    usrcodigo = encriptar(codigo)
    usrclave = encriptar(clave)
    results = db.session.query(Usuario.usrnombre.label("nombre_usuario")).filter(Usuario.usrcodigo == usrcodigo and Usuario.usrclave == usrclave).first()

    local_schema = UsuarioSchema(many=True)
    output = local_schema.dump(results)

    return jsonify(output)
