from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.AsignacionDeClientesAUsu import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importamos la librería de encriptación de tu arquitectura
from services.encrip_desencrip import encriptar


@bp.route("/saveAsignacionCartera", methods=["POST"])
@jwt_required()
@api_endpoint
def saveAsignacionCartera():
    # 1. Extracción de sesión y variables globales[cite: 10]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras[cite: 10]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. Recepción del JSON Maestro desde el Frontend[cite: 10]
    data = request.get_json()
    usrcodigo_select = data.get("usrcodigo")
    asignaciones = data.get("asignaciones", [])

    if not usrcodigo_select or str(usrcodigo_select).strip() == "":
        raise ValidationError("El código de usuario es obligatorio para grabar la asignación.")

    # ====================================================================
    # ENCRIPTACIÓN DEL USUARIO SELECCIONADO
    # ====================================================================
    usrcodigo_encriptado = encriptar(str(usrcodigo_select).strip())

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Iniciamos el bloque transaccional (BEGIN TRAN)[cite: 10]
        with connection.begin():

            # 4. LIMPIEZA DE NIVEL 2 (Documentos Granulares)[cite: 10]
            # Borramos utilizando el código encriptado
            sql_del_n2 = text(
                """
                DELETE FROM gdoc_usuariodocumento
                WHERE ciacodigo = :cia AND usrcodigo = :usrcodigo
                """
            )
            connection.execute(sql_del_n2, {"cia": sCodCia, "usrcodigo": usrcodigo_encriptado})

            # 5. LIMPIEZA DE NIVEL 1 (Cartera de Clientes)[cite: 10]
            # Borramos utilizando el código encriptado
            sql_del_n1 = text(
                """
                DELETE FROM gdoc_usuariocliente
                WHERE ciacodigo = :cia AND usrcodigo = :usrcodigo
                """
            )
            connection.execute(sql_del_n1, {"cia": sCodCia, "usrcodigo": usrcodigo_encriptado})

            # Si el frontend envió un arreglo vacío (el gerente le quitó todos los clientes),
            # la transacción termina exitosamente aquí.[cite: 10]
            if not asignaciones:
                return {"data": "Se ha vaciado la cartera del usuario exitosamente."}

            # 6. MAPEO DE DATOS PARA INSERCIÓN MASIVA[cite: 10]
            to_insert_n1 = []
            to_insert_n2 = []

            for asig in asignaciones:
                clicodigo = asig.get("clicodigo")
                hereda = asig.get("hereda_documentos", False)
                documentos = asig.get("documentos", [])

                if not clicodigo:
                    continue

                # Preparar registro Nivel 1 (Cliente)[cite: 10]
                # Insertamos usando la variable encriptada
                to_insert_n1.append(
                    {
                        "ciacodigo": sCodCia,
                        "usrcodigo": usrcodigo_encriptado,
                        "clientecodigo": str(clicodigo).strip().upper(),
                        "hereda_documentos": 1 if hereda else 0,
                        "estado": "A",
                        "fecisys": fecha_pura,
                        "horisys": hora_pura,
                        "usuisys": str(sUsuario)[:10],
                        "estisys": str(sNomEst)[:40],
                    }
                )

                # Preparar registros Nivel 2 (Solo si NO hereda y hay documentos seleccionados)[cite: 10]
                # Insertamos usando la variable encriptada
                if not hereda and documentos:
                    for doc_uuid in documentos:
                        to_insert_n2.append(
                            {
                                "ciacodigo": sCodCia,
                                "usrcodigo": usrcodigo_encriptado,
                                "documentouuid": str(doc_uuid).strip(),
                                "permiso_ver": 1,
                            }
                        )

            # 7. EJECUCIÓN DE INSERCIÓN NIVEL 1[cite: 10]
            if to_insert_n1:
                sql_ins_n1 = text(
                    """
                    INSERT INTO gdoc_usuariocliente (
                        ciacodigo, usrcodigo, clientecodigo, hereda_documentos, estado,
                        fecisys, horisys, usuisys, estisys
                    ) VALUES (
                        :ciacodigo, :usrcodigo, :clientecodigo, :hereda_documentos, :estado,
                        :fecisys, :horisys, :usuisys, :estisys
                    )
                    """
                )
                connection.execute(sql_ins_n1, to_insert_n1)

            # 8. EJECUCIÓN DE INSERCIÓN NIVEL 2[cite: 10]
            if to_insert_n2:
                sql_ins_n2 = text(
                    """
                    INSERT INTO gdoc_usuariodocumento (
                        ciacodigo, usrcodigo, documentouuid, permiso_ver
                    ) VALUES (
                        :ciacodigo, :usrcodigo, :documentouuid, :permiso_ver
                    )
                    """
                )
                connection.execute(sql_ins_n2, to_insert_n2)

    # 9. Retorno exitoso si el bloque BEGIN TRAN hizo el COMMIT correctamente[cite: 10]
    return {"data": "Asignación de cartera guardada exitosamente.", "clientes_asignados": len(to_insert_n1), "permisos_granulares": len(to_insert_n2)}
