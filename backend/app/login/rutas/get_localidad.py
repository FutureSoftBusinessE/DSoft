# flake8: noqa
from flask import jsonify, request
from sqlalchemy import text, and_
from app.login import bp
from app.extensions import db
from flask_cors import cross_origin
from app.models.Cgblocal import Cgblocal, CgblocalSchema
from app.models.DynamicLoginDB import DynamicLoginDB, DynamicLoginDBSchema
from app.models.Siactloc import Siactloc
from app.models.fsbsmcliusu import fsbsmcliusu, fsbsmcliusu_schema_varios, fsbsmcliusu_schema
from app.models.fsbsmclicia import fsbsmclicia, fsbsmclicia_schema_varios, fsbsmclicia_schema
from app.models.siacopc import Siacopc, SiacopcSchema
from app.models.siactusrweb import Siactusrweb, SiactusrwebSchema
from services.encrip_desencrip import encriptar, desencriptar


from app.models.CgblocalPrueba import CgblocalP, CgblocalPSchema


from app.models.SiactlocPrueba import SiactlocP, SiactlocPSchema
from app.db import get_session


# {
#   "user": "Â­v}xg",
#   "password": "I4bÂªszuj",
#   "seleccion":
#       {
#           "cliciaciacodigo": "01",
#           "cliciacianombre": "PRACTICASA",
#           "clicianonBD": "SiacPracticasa",
#           "cliciarutaBD": "fsoftapptest.futuresoft-ec.com,14666"
#       }
# }
@bp.route("/get_localidad", methods=["POST"])
@cross_origin()
def get_localidad():
    data = request.get_json() if request.is_json else None
    cliciausu = encriptar(data["user"])
    seleccion = data["seleccion"]
    ciacodigo = seleccion["cliciaciacodigo"]
    clicianonBD = seleccion["clicianonBD"]

    db.session = get_session(clicianonBD)

    results = db.session.query(Cgblocal.locdescri, Cgblocal.loccodigo).join(Siactloc, and_(Siactloc.ciacodigo == Cgblocal.ciacodigo, Siactloc.loccodigo == Cgblocal.loccodigo)).filter(Siactloc.ciacodigo == ciacodigo, Siactloc.usrcodigo == cliciausu, Cgblocal.locstatus == "A").distinct().all()

    # Serialización de los resultados con Marshmallow
    # local_schema = CgblocalSchema()
    local_schema = CgblocalSchema(many=True)
    output = local_schema.dump(results)

    # output = [
    #     row._asdict() for row in results
    # ]

    return jsonify(output)


# @bp.route('/get_localidadPrueba', methods=['POST'])
# @cross_origin()
# def get_localidadP():
#     # Cgblocal("SiacPracticasa.dbo")

#     data = request.get_json() if request.is_json else None
#     cliciausu = encriptar( data['user'])
#     seleccion = data['seleccion']
#     ciacodigo =seleccion['cliciaciacodigo']

#     # results = db.session.query(
#     #     Cgblocal.locdescri, Cgblocal.loccodigo, Cgblocal.ciacodigo
#     # ).all()

#     # class DynamicSiactloc(Siactloc):
#     #     _table_args_ = {'schema': "SiacPracticasa.dbo"}

#     def create_dynamic_cgblocal(clicianonBD):
#         class DynamicCgblocal(Cgblocal):
#             __table_args__ = {'schema': clicianonBD}

#         return DynamicCgblocal

#     DynamicCgblocal = create_dynamic_cgblocal("SiacPracticasa.dbo")

#     results = db.session.query(
#         DynamicCgblocal.locdescri, DynamicCgblocal.loccodigo, DynamicCgblocal.ciacodigo
#     ).all()

#     # Serialización de los resultados con Marshmallow
#     # local_schema = CgblocalSchema()
#     # local_schema = CgblocalSchema(many=True)
#     # output = local_schema.dump(results)

#     print(results)

#     # return jsonify(output)
#     return "ll"


# class DynamicSiactloc(Siactloc):
#         _table_args_ = {'schema': clicianonBD}

#     results = db.session.query(
#         Cgblocal.locdescri, Cgblocal.loccodigo
#     ).join(
#         DynamicSiactloc, DynamicSiactloc.ciacodigo == Cgblocal.ciacodigo
#     ).filter(
#         DynamicSiactloc.ciacodigo == ciacodigo,
#         DynamicSiactloc.usrcodigo == cliciausu,
#         Cgblocal.locstatus == 'A'
#     ).distinct().all()


# def select_table_args_based_on_user_type(model_class):
#     # AquÃ­ debes obtener el tipo de usuario de alguna manera, por ejemplo, a partir del token de autenticación.
#     # Supongamos que el tipo de usuario se almacena en g.user_type despuÃ©s de la autenticación.

#     user_type = "SiacPracticasa.dbo"  # ObtÃ©n el tipo de usuario desde el contexto de la solicitud

#     # Dependiendo del tipo de usuario, modifica los __table_args__ del modelo
#     model_class.__table_args__["schema"] = user_type
#     # Agrega mÃ¡s casos segÃºn los diferentes tipos de usuarios y sus configuraciones de modelo si es necesario


# @bp.before_request
# def before_request():
#     # Llama al middleware y pÃ¡sale la clase del modelo que deseas ajustar.
#     select_table_args_based_on_user_type(Cgblocal)
#     print("aquii!!!!!!!!!")


# @bp.route('/get_localidadPrueba', methods=['POST'])
# @cross_origin()
# def get_localidadP():
#     data = request.get_json() if request.is_json else None
#     cliciausu = encriptar( data['user'])
#     seleccion = data['seleccion']
#     ciacodigo =seleccion['cliciaciacodigo']
#     cianombd = seleccion["clicianonBD"]

#     name = "SiacPracticasa"

#     if(name == "SiacPracticasa"):

#         results = db.session.query(
#             Cgblocal.locdescri, Cgblocal.loccodigo
#         ).join(
#             Siactloc, Siactloc.ciacodigo == Cgblocal.ciacodigo
#         ).filter(
#             Siactloc.ciacodigo == ciacodigo,
#             Siactloc.usrcodigo == cliciausu,
#             Cgblocal.locstatus == 'A'
#         ).distinct().all()
#         local_schema = CgblocalSchema(many=True)
#         output = local_schema.dump(results)
#     else:
#         results = db.session.query(
#             CgblocalP.locdescri, CgblocalP.loccodigo
#         ).join(
#             SiactlocP, SiactlocP.ciacodigo == CgblocalP.ciacodigo
#         ).filter(
#             SiactlocP.ciacodigo == ciacodigo,
#             SiactlocP.usrcodigo == cliciausu,
#             CgblocalP.locstatus == 'A'
#         ).distinct().all()
#         local_schema = CgblocalPSchema(many=True)
#         output = local_schema.dump(results)


#     # Serialización de los resultados con Marshmallow
#     # local_schema = CgblocalSchema()


#     return jsonify(output)
