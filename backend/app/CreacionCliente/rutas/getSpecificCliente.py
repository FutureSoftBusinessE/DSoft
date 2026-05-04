from flask import jsonify, request
from app.CreacionCliente import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/getSpecificCliente", methods=["POST"])
@cross_origin()
@jwt_required()
def getSpecificCliente():
    # Obtener datos del token JWT
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    # Obtener el clicodigo del body
    data = request.get_json()
    clicodigo = data.get("clicodigo")

    if not clicodigo:
        return jsonify({"tipmsg": "Error", "msg": "El código del cliente es requerido"}), 400

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Consulta para obtener todos los datos del cliente específico
            query = """
                SELECT
                    ciacodigo,
                    clicodigo,
                    clinombre,
                    cliruc,
                    cliidentifica,
                    clidirec,
                    clitelef1,
                    clitelef2,
                    cliintersec,
                    clifax,
                    cliemail,
                    clifecisys,
                    clihorisys,
                    clistatus,
                    zoncodigo,
                    regcodigo,
                    cliapliiva,
                    procodigo,
                    cliestciv,
                    cliivaped,
                    clibloqueo,
                    cliidencon,
                    ciucodigo,
                    clirucmatriz,
                    clinommatriz,
                    tarenviosta,
                    clicuotaven,
                    clidiapago,
                    clidiasrecibefac1,
                    clidiaentregafac,
                    cliconespecial,
                    clipersona,
                    cliorigening,
                    clidemanda,
                    clicastigada,
                    cliparterel,
                    activicodigo,
                    sectorcodigo,
                    cliusuisys,
                    cliusumsys,
                    clifecmsys,
                    clihormsys,
                    tipcodigo,
                    cliestisys,
                    cliestmsys,
                    clisexo,
                    clifecnac,
                    cliprofesion,
                    clirepres
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                AND clicodigo = :clicodigo
            """

            result = connection.execute(text(query), {"ciacodigo": ciacodigo, "clicodigo": clicodigo}).mappings().fetchone()

            if not result:
                return jsonify({"tipmsg": "Error", "msg": f"Cliente con código {clicodigo} no encontrado"}), 404

            cliente_dict = dict(result)

            # Formatear fechas
            date_fields = ["clifecnac", "clifecisys", "clifecmsys"]
            for field in date_fields:
                if cliente_dict.get(field):
                    cliente_dict[field] = cliente_dict[field].strftime("%Y-%m-%d")
                else:
                    cliente_dict[field] = ""

            # Formatear horas
            time_fields = ["clihorisys", "clihormsys"]
            for field in time_fields:
                if cliente_dict.get(field):
                    cliente_dict[field] = cliente_dict[field].strftime("%H:%M:%S")
                else:
                    cliente_dict[field] = ""

            # Campos descriptivos para el frontend
            # Tipo de identificación descriptivo
            tipo_ident = {"C": "Cédula", "R": "RUC", "P": "Pasaporte"}
            cliente_dict["cliidentifica_desc"] = tipo_ident.get(cliente_dict.get("cliidentifica", ""), "")

            # Sexo descriptivo
            if cliente_dict.get("clisexo") == "M":
                cliente_dict["clisexo_desc"] = "Masculino"
            elif cliente_dict.get("clisexo") == "F":
                cliente_dict["clisexo_desc"] = "Femenino"
            else:
                cliente_dict["clisexo_desc"] = ""

            # Estado civil descriptivo
            estado_civil_map = {"SOLTERO": "Soltero", "CASADO": "Casado", "DIVORCIADO": "Divorciado", "VIUDO": "Viudo", "UNION LIBRE": "Unión Libre"}
            cliestciv = cliente_dict.get("cliestciv", "")
            cliente_dict["cliestciv_desc"] = estado_civil_map.get(cliestciv, cliestciv)

            # Tipo de persona descriptivo
            if cliente_dict.get("clipersona") == "N":
                cliente_dict["clipersona_desc"] = "Natural"
            elif cliente_dict.get("clipersona") == "J":
                cliente_dict["clipersona_desc"] = "Jurídica"
            else:
                cliente_dict["clipersona_desc"] = ""

            # Tipo código descriptivo
            if cliente_dict.get("tipcodigo") == "001":
                cliente_dict["tipcodigo_desc"] = "Natural"
            elif cliente_dict.get("tipcodigo") == "002":
                cliente_dict["tipcodigo_desc"] = "Jurídica"
            else:
                cliente_dict["tipcodigo_desc"] = cliente_dict.get("tipcodigo", "")

            # Estado descriptivo
            if cliente_dict.get("clistatus") == "A":
                cliente_dict["cliestado_desc"] = "Activo"
                cliente_dict["cliestado_color"] = "success"
            elif cliente_dict.get("clistatus") == "I":
                cliente_dict["cliestado_desc"] = "Inactivo"
                cliente_dict["cliestado_color"] = "error"
            else:
                cliente_dict["cliestado_desc"] = cliente_dict.get("clistatus", "")
                cliente_dict["cliestado_color"] = "default"

            # Campos con valores especiales
            if cliente_dict.get("cliapliiva") == -1:
                cliente_dict["cliapliiva_desc"] = "No Aplica"
            else:
                cliente_dict["cliapliiva_desc"] = "Aplica"

            if cliente_dict.get("cliivaped") == -1:
                cliente_dict["cliivaped_desc"] = "No Aplica"
            else:
                cliente_dict["cliivaped_desc"] = "Aplica"

    return jsonify({"tipmsg": "Success", "msg": "Cliente encontrado", "data": cliente_dict}), 200
