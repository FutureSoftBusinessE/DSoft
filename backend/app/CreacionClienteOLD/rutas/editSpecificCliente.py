from flask import jsonify, request
from app.CreacionCliente import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from services.encrip_desencrip import encriptar
from app import create_app


@bp.route("/editSpecificCliente", methods=["POST"])
@jwt_required()
def editSpecificCliente():
    # Obtener datos del token JWT
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    # Obtener usuario del token
    usrcodigo = claims["user"]
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener fechas para auditoría
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    # Obtener los datos del cuerpo de la solicitud
    data = request.get_json()

    # Validar que venga el código del cliente
    clicodigo = data.get("clicodigo")
    if not clicodigo:
        return jsonify({"tipmsg": "Error", "msg": "El código del cliente es requerido"}), 400

    # ========== OBTENER TODOS LOS CAMPOS PARA ACTUALIZAR ==========

    # Campos principales
    tipcodigo = data.get("tipcodigo", "")
    cliidentifica = data.get("cliidentifica", "")
    cliruc = data.get("cliruc", "")
    clinombre = data.get("clinombre", "")
    clidirec = data.get("clidirec", "")
    cliemail = data.get("cliemail", "")

    # Campos personales
    clisexo = data.get("clisexo", "")
    cliestciv = data.get("cliestciv", "")
    clifecnac = data.get("clifecnac", "")
    clipersona = data.get("clipersona", "")

    # Campos de contacto
    cliintersec = data.get("cliintersec", "")
    clitelef1 = data.get("clitelef1", "")
    clitelef2 = data.get("clitelef2", "")
    clifax = data.get("clifax", "")

    # Campos adicionales
    cliprofesion = data.get("cliprofesion", "")
    clirepres = data.get("clirepres", "")

    # Campos con valores por defecto
    clidiasrecibefac1 = data.get("clidiasrecibefac1", "0")
    cliconespecial = data.get("cliconespecial", "0")

    # Estado del cliente
    clistatus = data.get("clistatus", "A")

    # ========== CONEXIÓN A LA BASE DE DATOS ==========
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as conn:
            with conn.begin():
                # ========== VERIFICAR QUE EL CLIENTE EXISTA ==========
                verificar_cliente_query = """
                SELECT COUNT(*) as existe
                FROM cxcmcli
                WHERE ciacodigo = :ciacodigo
                AND clicodigo = :clicodigo
                """

                cliente_existente = conn.execute(text(verificar_cliente_query), {"ciacodigo": ciacodigo, "clicodigo": clicodigo}).mappings().fetchone()

                if not cliente_existente or cliente_existente["existe"] == 0:
                    return jsonify({"tipmsg": "Error", "msg": f"Cliente con código {clicodigo} no existe"}), 404

                # ========== PREPARAR FECHA DE NACIMIENTO ==========
                clifecnac_dt = None
                if clifecnac:
                    try:
                        clifecnac_dt = datetime.strptime(clifecnac, "%Y-%m-%d")
                    except ValueError:
                        clifecnac_dt = None

                # ========== ACTUALIZAR EL CLIENTE EN CXCMCLI ==========
                update_cliente_query = """
                UPDATE cxcmcli SET
                    clinombre = :clinombre,
                    cliruc = :cliruc,
                    clidirec = :clidirec,
                    clitelef1 = :clitelef1,
                    clitelef2 = :clitelef2,
                    cliintersec = :cliintersec,
                    clifax = :clifax,
                    cliemail = :cliemail,
                    clistatus = :clistatus,
                    cliestciv = :cliestciv,
                    cliidentifica = :cliidentifica,
                    clidiasrecibefac1 = :clidiasrecibefac1,
                    cliconespecial = :cliconespecial,
                    clipersona = :clipersona,
                    tipcodigo = :tipcodigo,
                    clisexo = :clisexo,
                    clifecnac = :clifecnac,
                    cliprofesion = :cliprofesion,
                    clirepres = :clirepres,
                    cliusumsys = :cliusumsys,
                    clifecmsys = :clifecmsys,
                    clihormsys = :clihormsys,
                    cliestmsys = :cliestmsys
                WHERE ciacodigo = :ciacodigo
                AND clicodigo = :clicodigo
                """

                # Ejecutar la actualización
                conn.execute(
                    text(update_cliente_query),
                    {
                        "ciacodigo": ciacodigo,
                        "clicodigo": clicodigo,
                        "clinombre": clinombre,
                        "cliruc": cliruc,
                        "clidirec": clidirec,
                        "clitelef1": clitelef1,
                        "clitelef2": clitelef2,
                        "cliintersec": cliintersec,
                        "clifax": clifax,
                        "cliemail": cliemail,
                        "clistatus": clistatus,
                        "cliestciv": cliestciv,
                        "cliidentifica": cliidentifica,
                        "clidiasrecibefac1": int(clidiasrecibefac1) if clidiasrecibefac1 else 0,
                        "cliconespecial": int(cliconespecial) if cliconespecial else 0,
                        "clipersona": clipersona,
                        "tipcodigo": tipcodigo,
                        "clisexo": clisexo,
                        "clifecnac": clifecnac_dt,
                        "cliprofesion": cliprofesion,
                        "clirepres": clirepres,
                        "cliusumsys": usrcodigo,
                        "clifecmsys": fecha_con_hora_cero,
                        "clihormsys": fecha_formato_1900,
                        "cliestmsys": ipUser,
                    },
                )

                # ========== RETORNAR RESPUESTA DE ÉXITO ==========
                return jsonify({"tipmsg": "Success", "msg": f"Cliente con código {clicodigo} actualizado con éxito", "data": {"ciacodigo": ciacodigo, "clicodigo": clicodigo, "clinombre": clinombre, "cliruc": cliruc, "clistatus": clistatus}}), 200

    except Exception as e:
        print(f"Error al actualizar cliente en cxcmcli: {str(e)}")
        return jsonify({"tipmsg": "Error", "msg": f"Error al actualizar cliente: {str(e)}"}), 400
