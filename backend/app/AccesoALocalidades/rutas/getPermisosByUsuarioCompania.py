from flask import jsonify, request
from app.AccesoALocalidades import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from services.encrip_desencrip import desencriptar
import base64


@bp.route("/getPermisosByUsuarioCompania", methods=["POST"])
@jwt_required()
def get_permisos_by_usuario_compania():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json()
    usrcodigo = data["usrcodigo"]

    if not usrcodigo:
        return jsonify({"error": {"success": False, "message": "usrcodigo es requerido"}}), 400

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # 1. Primero obtenemos todas las localidades de la compañía
                query_localidades = """
                SELECT loccodigo
                FROM cgblocal
                WHERE ciacodigo = :ciacodigo
                AND locstatus = 'A'
                """
                localidades_result = connection.execute(text(query_localidades), {"ciacodigo": ciacodigo}).mappings().fetchall()

                localidades = [row["loccodigo"] for row in localidades_result]

                # 2. Obtenemos permisos existentes del usuario
                query_permisos = """
                SELECT
                    ciacodigo,
                    usrcodigo,
                    loccodigo,
                    locfecmsys,
                    lochormsys,
                    locusumsys,
                    usrflagcaj,
                    usrcajdesc,
                    usrflagsup,
                    usrsupdesc,
                    usrflagger,
                    usrgerdesc,
                    usrmonaprocom,
                    usrflaganuped,
                    usrflaganufac,
                    usrflageliant,
                    usrflagelicob,
                    usrflagemiped,
                    usrflagemifac,
                    usrflagemicob,
                    usrflagemiab,
                    usrflagemincd,
                    usrflagemincm,
                    usrflagemidg,
                    usrflagemind,
                    usrflagemitrainv,
                    usrflagemicominv,
                    usrflagemicomser,
                    usrflagemigasaso,
                    usrflagemipagpro,
                    usrflagemipagdir,
                    usrflagemiantpro,
                    usrflaganuordcom,
                    usrflaganugasaso,
                    usrflaganupagpro,
                    usrflaganupagdir,
                    usrflaganucheque,
                    usrflagemicobrel,
                    usrflagemindmor,
                    usrflagemindref,
                    usrflagemindces,
                    usrflagivapedido,
                    usrflagvencedg,
                    usrflagvencegift,
                    usrflagemifaccxp,
                    usrflagemindcxp,
                    usrflageminccxp,
                    usrflagmodcredito,
                    usrmontolineacre,
                    locestmsys,
                    locaccion,
                    usrflagaprproyecto,
                    usrflagcrucecta,
                    usrflaganuproforma,
                    usrflagclicomenta,
                    usrflagclicreahis,
                    usrflagclielihis,
                    usrflagrentabilidadped,
                    usrflagdescuentoglobal,
                    usrflagvercostoinvcomp,
                    usrflagmodificaarticulo
                FROM siactloc
                WHERE ciacodigo = :ciacodigo
                AND usrcodigo = :usrcodigo
                AND loccodigo IN :localidades
                """

                permisos_result = connection.execute(text(query_permisos), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo), "localidades": tuple(localidades)}).mappings().fetchall()

                # Convertir resultados a diccionario por loccodigo
                permisos_dict = {}
                for row in permisos_result:
                    perm_dict = dict(row)
                    # Desencriptar campos si es necesario
                    if "usrcodigo" in perm_dict:
                        perm_dict["usrcodigo"] = desencriptar(perm_dict["usrcodigo"])
                    permisos_dict[perm_dict["loccodigo"]] = perm_dict

                # 3. Construir respuesta con todas las localidades
                respuesta = []
                for loccodigo in localidades:
                    if loccodigo in permisos_dict:
                        # Ya existe registro → estado UPDATE
                        perm = permisos_dict[loccodigo]
                        perm["locaccion"] = "UPDATE"
                        respuesta.append(perm)
                    else:
                        # No existe registro → estado CREATE con valores por defecto
                        respuesta.append(
                            {
                                "ciacodigo": ciacodigo,
                                "usrcodigo": usrcodigo,
                                "loccodigo": loccodigo,
                                "locaccion": "CREATE",
                                "usrflagcaj": 0,
                                "usrflagsup": 0,
                                "usrflagger": 0,
                                "usrflaganuped": 0,
                                "usrflaganufac": 0,
                                "usrflageliant": 0,
                                "usrflagelicob": 0,
                                "usrflagemiped": 0,
                                "usrflagemifac": 0,
                                "usrflagemicob": 0,
                                "usrflagemiab": 0,
                                "usrflagemincd": 0,
                                "usrflagemincm": 0,
                                "usrflagemidg": 0,
                                "usrflagemind": 0,
                                "usrflagemitrainv": 0,
                                "usrflagemicominv": 0,
                                "usrflagemicomser": 0,
                                "usrflagemigasaso": 0,
                                "usrflagemipagpro": 0,
                                "usrflagemipagdir": 0,
                                "usrflagemiantpro": 0,
                                "usrflaganuordcom": 0,
                                "usrflaganugasaso": 0,
                                "usrflaganupagpro": 0,
                                "usrflaganupagdir": 0,
                                "usrflaganucheque": 0,
                                "usrflagemicobrel": 0,
                                "usrflagemindmor": 0,
                                "usrflagemindref": 0,
                                "usrflagemindces": 0,
                                "usrflagivapedido": 0,
                                "usrflagvencedg": 0,
                                "usrflagvencegift": 0,
                                "usrflagemifaccxp": 0,
                                "usrflagemindcxp": 0,
                                "usrflageminccxp": 0,
                                "usrflagmodcredito": 0,
                                "usrflagaprproyecto": 0,
                                "usrflagcrucecta": 0,
                                "usrflaganuproforma": 0,
                                "usrflagclicomenta": 0,
                                "usrflagclicreahis": 0,
                                "usrflagclielihis": 0,
                                "usrflagrentabilidadped": 0,
                                "usrflagdescuentoglobal": 0,
                                "usrflagvercostoinvcomp": 0,
                                "usrflagmodificaarticulo": 0,
                                "usrcajdesc": 0.0,
                                "usrsupdesc": 0.0,
                                "usrgerdesc": 0.0,
                                "usrmonaprocom": 0.0,
                                "usrmontolineacre": 0.0,
                            }
                        )

        return jsonify({"data": respuesta}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": {"success": False, "message": f"Error al obtener permisos: {str(e)}"}}), 500
