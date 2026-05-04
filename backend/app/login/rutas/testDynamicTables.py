# flake8: noqa
# import json
# from flask import jsonify, request
# from app.login import bp
# from flask_cors import cross_origin
# from app.models.siacPracticasaSiacusr import siacPracticasaSiacusr
# from app.db import get_session
# from app.extensions import db
# from services.encrip_desencrip import encriptar, desencriptar
# from services.encrip_desencrip import encriptar, desencriptar

# # SiacIlsaboremio
# #  recibe esta estructura
# # {
# #   "user": "Â­v}xg",
# #   "password": "I4bÂªszuj",
# #   "seleccion":
# #       {
# #           "cliciaciacodigo": "01",
# #           "cliciacianombre": "PRACTICASA",
# #           "clicianonBD": "SiacPracticasa",
# #           "cliciarutaBD": "fsoftapptest.futuresoft-ec.com,14666"
# #       },
# # }
# @bp.route('/testDynamics', methods=['POST'])
# @cross_origin()
# def testDynamics():
#     data = request.get_json() if request.is_json else None
#     # usrcodigo = data['user']
#     password = data['password']
#     db_selected = data['seleccion']['clicianonBD']

#     db.session = get_session(db_selected)

#     result = db.session.query(
#         siacPracticasaSiacusr.usrcodigo,
#         siacPracticasaSiacusr.usrnombre,
#         siacPracticasaSiacusr.usrclave
#     ).all()

#     result_dict = [
#         {'usrcodigo': desencriptar(r.usrcodigo),
#         'usrnombre' : (r.usrnombre),
#         'usrclave' : desencriptar(r.usrclave)
#         }
#                     for r in result]  # convertir las filas a diccionarios
#     return jsonify(result_dict)
