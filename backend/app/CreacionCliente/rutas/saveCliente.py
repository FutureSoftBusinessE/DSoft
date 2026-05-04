from flask import jsonify, request
from app.CreacionCliente import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/saveCliente", methods=["POST"])
@cross_origin()
@jwt_required()
def saveCliente():
    # Obtener datos del token JWT
    claims = get_jwt()

    # Obtener datos de conexión desde el token
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["seleccion"].get("loccodigo", "001")  # Valor por defecto si no existe

    # Obtener usuario del token
    usrcodigo = claims["user"]
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener fechas para auditoría
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    # Obtener los datos del cuerpo de la solicitud
    data = request.get_json()

    # ========== OBTENER TODOS LOS CAMPOS DE LA TABLA CXCMCLI ==========

    # Campos principales (del formulario)
    tipcodigo = data.get("tipcodigo", "")  # 001=Natural, 002=Jurídica
    cliidentifica = data.get("cliidentifica", "")  # C=Cédula, R=RUC, P=Pasaporte
    cliruc = data.get("cliruc", "")  # Número de identificación
    clinombre = data.get("clinombre", "")  # Nombre/Razón Social
    clidirec = data.get("clidirec", "")  # Dirección
    cliemail = data.get("cliemail", "")  # Email

    # Campos personales
    clisexo = data.get("clisexo", "")  # M=Masculino, F=Femenino
    cliestciv = data.get("cliestciv", "")  # Estado civil
    clifecnac = data.get("clifecnac", "")  # Fecha de nacimiento
    clipersona = data.get("clipersona", "N")  # N=Natural, J=Jurídica

    # Campos de contacto
    cliintersec = data.get("cliintersec", "")  # Intersección/teléfono celular
    clitelef1 = data.get("clitelef1", "")  # Teléfono 1
    clitelef2 = data.get("clitelef2", "")  # Teléfono 2
    clifax = data.get("clifax", "")  # Fax

    # Campos adicionales
    cliprofesion = data.get("cliprofesion", "")  # Profesión

    # Campos con valores por defecto (se envían desde frontend o se establecen aquí)
    clirepres = data.get("clirepres", "")  # Representante legal
    clirucmatriz = data.get("clirucmatriz", "")  # RUC matriz
    clinommatriz = data.get("clinommatriz", "")  # Nombre matriz
    clidiasrecibefac1 = data.get("clidiasrecibefac1", "0")
    cliconespecial = data.get("cliconespecial", "0")

    # ========== CONEXIÓN A LA BASE DE DATOS ==========
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as conn:
            with conn.begin():
                # ========== GENERAR SECUENCIA PARA EL CLIENTE ==========
                _seccodigo = "CLI"

                # Obtener la secuencia actual
                siacsec_query = """
                SELECT secnumero
                FROM siacsec
                WHERE ciacodigo = :ciacodigo AND locservidor = :locservidor AND seccodigo = :seccodigo
                """
                siacsec_result = conn.execute(text(siacsec_query), {"ciacodigo": ciacodigo, "locservidor": "A", "seccodigo": _seccodigo}).mappings().fetchone()

                if siacsec_result is None:
                    # Crear secuencia si no existe
                    crear_secuencia_query = """
                    INSERT INTO siacsec (ciacodigo, locservidor, seccodigo, secnumero)
                    VALUES (:ciacodigo, :locservidor, :seccodigo, 0)
                    """
                    conn.execute(
                        text(crear_secuencia_query),
                        {
                            "ciacodigo": ciacodigo,
                            "locservidor": "A",
                            "seccodigo": _seccodigo,
                        },
                    )
                    secuenciaActualCliente = 0
                else:
                    secuenciaActualCliente = siacsec_result["secnumero"]

                nuevaSecuenciaActualCliente = secuenciaActualCliente + 1
                clienteCodigoGenerated = f"{nuevaSecuenciaActualCliente:06}"

                # Actualizar la secuencia
                update_secuencia_query = """
                UPDATE siacsec
                SET secnumero = :nuevaSecuencia
                WHERE ciacodigo = :ciacodigo AND locservidor = :locservidor AND seccodigo = :seccodigo
                """
                conn.execute(
                    text(update_secuencia_query),
                    {
                        "nuevaSecuencia": nuevaSecuenciaActualCliente,
                        "ciacodigo": ciacodigo,
                        "locservidor": "A",
                        "seccodigo": _seccodigo,
                    },
                )

                # ========== OBTENER VALORES POR DEFECTO DE OTRAS TABLAS ==========

                # Obtener valores de activicodigo y sectorcodigo desde Cgblocal
                default_info_query = """
                    SELECT activicodigo, sectorcodigo
                    FROM cgblocal
                    WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo
                """
                default_info = conn.execute(text(default_info_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchone()

                if default_info is None:
                    # Si no existe la localidad, usar valores por defecto
                    activicodigo = "000"
                    sectorcodigo = "000"
                else:
                    activicodigo = default_info["activicodigo"]
                    sectorcodigo = default_info["sectorcodigo"]

                # Obtener códigos por defecto desde el primer cliente existente
                codigos_query = """
                    SELECT zoncodigo, tipcodigo, regcodigo, ciucodigo, procodigo
                    FROM cxcmcli
                    WHERE ciacodigo = :ciacodigo AND clicodigo = '000001'
                """
                codigos = conn.execute(text(codigos_query), {"ciacodigo": ciacodigo}).mappings().fetchone()

                if codigos is None:
                    # Si no existe cliente 000001, usar valores por defecto
                    zoncodigo = ""
                    regcodigo = ""
                    ciucodigo = ""
                    procodigo = ""
                    # Mantener el tipcodigo del formulario
                else:
                    zoncodigo = codigos["zoncodigo"]
                    regcodigo = codigos["regcodigo"]
                    ciucodigo = codigos["ciucodigo"]
                    procodigo = codigos["procodigo"]
                    # El tipcodigo viene del formulario, no se sobreescribe

                # ========== INSERTAR EL NUEVO CLIENTE EN CXCMCLI ==========
                insert_cliente_query = """
                INSERT INTO cxcmcli (
                    ciacodigo,
                    clicodigo,
                    clinombre,
                    cliruc,
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
                    cliidentifica,
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
                ) VALUES (
                    :ciacodigo,
                    :clicodigo,
                    :clinombre,
                    :cliruc,
                    :clidirec,
                    :clitelef1,
                    :clitelef2,
                    :cliintersec,
                    :clifax,
                    :cliemail,
                    :clifecisys,
                    :clihorisys,
                    'A',
                    :zoncodigo,
                    :regcodigo,
                    -1,
                    :procodigo,
                    :cliestciv,
                    -1,
                    0,
                    :cliidentifica,
                    'O',
                    :ciucodigo,
                    :clirucmatriz,
                    :clinommatriz,
                    'D',
                    0,
                    0,
                    :clidiasrecibefac1,
                    0,
                    :cliconespecial,
                    :clipersona,
                    'I',
                    0,
                    0,
                    0,
                    :activicodigo,
                    :sectorcodigo,
                    :cliusuisys,
                    :cliusumsys,
                    :clifecmsys,
                    :clihormsys,
                    :tipcodigo,
                    :cliestisys,
                    :cliestmsys,
                    :clisexo,
                    :clifecnac,
                    :cliprofesion,
                    :clirepres
                )
                """

                # Preparar fecha de nacimiento si existe
                clifecnac_dt = None
                if clifecnac:
                    try:
                        clifecnac_dt = datetime.strptime(clifecnac, "%Y-%m-%d")
                    except ValueError:
                        clifecnac_dt = None

                # Ejecutar la inserción
                conn.execute(
                    text(insert_cliente_query),
                    {
                        "ciacodigo": ciacodigo,
                        "clicodigo": clienteCodigoGenerated,
                        "clinombre": clinombre,
                        "cliruc": cliruc,
                        "clidirec": clidirec,
                        "clitelef1": clitelef1,
                        "clitelef2": clitelef2,
                        "cliintersec": cliintersec,
                        "clifax": clifax,
                        "cliemail": cliemail,
                        "clifecisys": fecha_con_hora_cero,
                        "clihorisys": fecha_formato_1900,
                        "zoncodigo": zoncodigo,
                        "regcodigo": regcodigo,
                        "procodigo": procodigo,
                        "cliestciv": cliestciv,
                        "cliidentifica": cliidentifica,
                        "ciucodigo": ciucodigo,
                        "clirucmatriz": clirucmatriz,
                        "clinommatriz": clinommatriz,
                        "clidiasrecibefac1": int(clidiasrecibefac1) if clidiasrecibefac1 else 0,
                        "cliconespecial": int(cliconespecial) if cliconespecial else 0,
                        "clipersona": clipersona,
                        "activicodigo": activicodigo,
                        "sectorcodigo": sectorcodigo,
                        "cliusuisys": usrcodigo,
                        "cliusumsys": usrcodigo,
                        "clifecmsys": fecha_con_hora_cero,
                        "clihormsys": fecha_formato_1900,
                        "tipcodigo": tipcodigo,
                        "cliestisys": ipUser,
                        "cliestmsys": ipUser,
                        "clisexo": clisexo,
                        "clifecnac": clifecnac_dt,
                        "cliprofesion": cliprofesion,
                        "clirepres": clirepres,
                    },
                )

                # ========== RETORNAR RESPUESTA DE ÉXITO ==========
                return jsonify({"tipmsg": "Success", "msg": f"Cliente con código {clienteCodigoGenerated} creado con éxito", "data": {"ciacodigo": ciacodigo, "clicodigo": clienteCodigoGenerated, "clinombre": clinombre, "cliruc": cliruc}}), 200

    except Exception as e:
        print(f"Error al crear cliente en cxcmcli: {str(e)}")
        return jsonify({"tipmsg": "Error", "msg": f"Error al crear cliente: {str(e)}"}), 400
