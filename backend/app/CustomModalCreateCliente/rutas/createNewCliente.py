from flask import request
from app.CustomModalCreateCliente import bp
from app.extensions import db

from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint, ValidationError, validate_required, NotFoundError, APIError

# from app.utils.validar_ruc_cedula import validar_ruc_cedula


@bp.route("/createNewCliente", methods=["POST"])
@jwt_required()
@api_endpoint
def createNewCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener los datos del cuerpo de la solicitud
    data = request.get_json()
    # Validación de campos obligatorios
    REQUIRED_FIELDS = [
        "cliidentifica",
        "cliruc",
        "clinombre",
        "clidirec",
        "cliemail",
    ]
    missing_fields = [field for field in REQUIRED_FIELDS if field not in data or not data[field]]

    if missing_fields:
        raise ValidationError("Faltan parámetros obligatorios", missing_fields)

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]  # Código de la compañía
    loccodigo = claims["localidad"]["loccodigo"]  # Código de la localidad
    tipcodigo = "001"  # Tipo de cliente (Por defecto lo esoty dejando en persona natural)
    cliidentifica = data.get("cliidentifica")  # Tipo de identificación
    cliruc = data.get("cliruc")  # Identificación
    clinombre = data.get("clinombre")  # Nombre
    clidirec = data.get("clidirec")  # Dirección
    cliintersec = data.get("cliintersec", "")  # Teléfono celular (opcional)
    clitelef1 = data.get("clitelef1", "")  # Teléfono 1 convencional (opcional)
    clitelef2 = data.get("clitelef2", "")  # Teléfono 2 convencional (opcional)
    clifax = data.get("clifax", "")  # Fax (opcional)
    cliemail = data.get("cliemail")  # Email

    # Conexion a la BD
    clicianonBD = claims["seleccion"]["clicianonBD"]
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Conexión y transacción

    with engine.connect() as conn:
        with conn.begin() as trans:
            # Verificar si la cedula ya existe
            existe_cedula_query = "SELECT COUNT(*) FROM cxcmcli WHERE cliruc = :cliruc"
            existe_cedula = conn.execute(text(existe_cedula_query), {"cliruc": cliruc})
            existe_cedula = existe_cedula.scalar() > 0

            if existe_cedula:
                # Hacer rollback si el cliente ya existe y detener la operación
                trans.rollback()
                raise APIError(f"Este cliente con valor en el campo cliruc {cliruc} ya existe")

            # es_valida, error_msg = validar_ruc_cedula(cliruc, "C")
            # if not es_valida:
            #     # Hacer rollback si el cliente ya existe y detener la operación
            #     trans.rollback()
            #     raise Exception(error_msg)

            # Verificar si el loccodigo existe
            existe_loccodigo_query = "SELECT COUNT(*) FROM cgblocal WHERE loccodigo = :loccodigo"
            existe_loccodigo = conn.execute(text(existe_loccodigo_query), {"loccodigo": loccodigo})
            existe_loccodigo = existe_loccodigo.scalar() > 0

            if not existe_loccodigo:
                # Hacer rollback si el loccodigo ya existe y detener la operación
                trans.rollback()
                raise APIError(f"La localidad con el loccodigo {loccodigo} no existe.")

            # Verificar si el tipcodigo ya existe
            existe_tipcodigo_query = "SELECT COUNT(*) FROM cxcbtipcli WHERE tipcodigo = :tipcodigo"
            existe_tipcodigo = conn.execute(text(existe_tipcodigo_query), {"tipcodigo": tipcodigo})
            existe_tipcodigo = existe_tipcodigo.scalar() > 0

            if not existe_tipcodigo:
                # Hacer rollback si el tipcodigo ya existe y detener la operación
                trans.rollback()
                raise APIError(f"El tipcodigo {tipcodigo} no existe.")

            # Generamos y obtenemos datos por defecto de un nuevo cliente
            # ----- --------ALGORITMO PARA GENERAR SECUENCIA CLIENTE ------------
            _seccodigo = "CLI"

            # Obtener la secuencia actual
            siacsec_query = """
            SELECT secnumero
            FROM siacsec
            WHERE ciacodigo = :ciacodigo AND locservidor = :locservidor AND seccodigo = :seccodigo
            """
            siacsec_result = conn.execute(text(siacsec_query), {"ciacodigo": ciacodigo, "locservidor": "A", "seccodigo": _seccodigo}).mappings().fetchone()

            if siacsec_result is None:
                trans.rollback()
                raise APIError("No se encontró la secuencia para el cliente.")

            secuenciaActualCliente = siacsec_result["secnumero"]
            nuevaSecuenciaActualCliente = secuenciaActualCliente + 1

            # Generar el nuevo código
            clienteCodigoGenerated = f"{nuevaSecuenciaActualCliente:06}"

            # Auditar la nueva secuencia
            update_siacsec = """
                UPDATE siacsec
                SET secnumero = :new_seccodigo
                WHERE ciacodigo = :ciacodigo AND locservidor = :locservidor AND seccodigo = :seccodigo
            """
            conn.execute(
                text(update_siacsec),
                {
                    "new_seccodigo": nuevaSecuenciaActualCliente,
                    "ciacodigo": ciacodigo,
                    "locservidor": "A",
                    "seccodigo": _seccodigo,
                },
            )

            # Auditar la nueva secuencia
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
            # Obtener valores de activicodigo y sectorcodigo desde Cgblocal
            default_info_query = """
                SELECT activicodigo, sectorcodigo
                FROM cgblocal
                WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo
            """
            default_info = conn.execute(text(default_info_query), {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchone()

            if default_info is None:
                trans.rollback()
                raise APIError(f"No se encontraron datos en Cgblocal para ciacodigo {ciacodigo} y loccodigo {loccodigo}.")

            # Guardar los valores en variables con el mismo nombre
            activicodigo = default_info["activicodigo"]
            sectorcodigo = default_info["sectorcodigo"]

            # Obtener codigos desde Cxcmcli
            codigos_query = """
                SELECT zoncodigo, tipcodigo, regcodigo, ciucodigo, procodigo
                FROM cxcmcli
                WHERE clicodigo = '000001' AND ciacodigo = :ciacodigo
            """
            codigos = conn.execute(text(codigos_query), {"ciacodigo": ciacodigo}).mappings().fetchone()

            if codigos is None:
                trans.rollback()
                raise APIError(f"No se encontraron datos en Cxcmcli para ciacodigo {ciacodigo}.")

            # Guardar los códigos en variables con el mismo nombre
            zoncodigo = codigos["zoncodigo"]
            tipcodigo = codigos["tipcodigo"]
            regcodigo = codigos["regcodigo"]
            ciucodigo = codigos["ciucodigo"]
            procodigo = codigos["procodigo"]

            # Crear la consulta SQL para insertar un nuevo cliente
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
                cliestmsys
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
                -1,  -- cliapliiva
                :procodigo,
                'SOLTERO',  -- cliestciv
                -1,  -- cliivaped
                0,  -- clibloqueo
                :cliidentifica,
                'O',  -- cliidencon
                :ciucodigo,
                :clirucmatriz,
                :clinommatriz,
                'D',  -- tarenviosta
                0,  -- clicuotaven
                0,  -- clidiapago
                0,  -- clidiasrecibefac1
                0,  -- clidiaentregafac
                0,  -- cliconespecial
                'N',  -- clipersona
                'I',  -- cliorigening
                0,  -- clidemanda
                0,  -- clicastigada
                0,  -- cliparterel
                :activicodigo,
                :sectorcodigo,
                :cliusuisys,
                :cliusumsys,
                :clifecmsys,
                :clihormsys,
                :tipcodigo,
                :cliestisys,
                :cliestmsys
            )
            """
            # Ejecutar la consulta de inserción
            conn.execute(
                text(insert_cliente_query),
                {
                    "ciacodigo": ciacodigo,
                    "clicodigo": clienteCodigoGenerated,
                    "clinombre": clinombre,
                    "cliruc": cliruc,
                    "clidirec": clidirec,
                    "clitelef1": clitelef1,
                    "clitelef2": clitelef2,  # Asigna un valor si es necesario
                    "cliintersec": cliintersec,
                    "clifax": clifax,
                    "cliemail": cliemail,
                    "zoncodigo": zoncodigo,
                    "regcodigo": regcodigo,
                    "procodigo": procodigo,
                    "cliidentifica": cliidentifica,
                    "ciucodigo": ciucodigo,
                    "clirucmatriz": "",
                    "clinommatriz": "",
                    "activicodigo": activicodigo,
                    "sectorcodigo": sectorcodigo,
                    "cliusuisys": sUsuario,
                    "cliusumsys": sUsuario,
                    "clifecisys": fecha_con_hora_cero,
                    "clihorisys": fecha_formato_1900,
                    "clifecmsys": fecha_con_hora_cero,
                    "clihormsys": fecha_formato_1900,
                    "tipcodigo": tipcodigo,
                    "cliestisys": ipUser,
                    "cliestmsys": ipUser,
                },
            )
            return {"msg": f"El cliente con código {clienteCodigoGenerated} ha sido creado exitosamente.", "details": {"tipmsg": "Success", "msg": f"Cliente con código {clienteCodigoGenerated} creado con éxito"}}
