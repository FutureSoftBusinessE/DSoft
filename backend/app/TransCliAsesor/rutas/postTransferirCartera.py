from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TransCliAsesor import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Importación de la librería de encriptación de tu arquitectura
from services.encrip_desencrip import encriptar


@bp.route("/transferirCartera", methods=["POST"])
@jwt_required()
@api_endpoint
def transferirCartera():
    # 1. Extracción de sesión y variables globales[cite: 23]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras de auditoría[cite: 23]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. Recepción de datos del Frontend[cite: 23]
    data = request.get_json()
    usrcodigo_origen = data.get("usrcodigo_origen")
    usrcodigo_destino = data.get("usrcodigo_destino")

    # 4. Validaciones de negocio[cite: 23]
    if not usrcodigo_origen or str(usrcodigo_origen).strip() == "":
        raise ValidationError("Debe seleccionar un Asesor de Origen.")
    if not usrcodigo_destino or str(usrcodigo_destino).strip() == "":
        raise ValidationError("Debe seleccionar un Asesor de Destino.")
    if str(usrcodigo_origen).strip() == str(usrcodigo_destino).strip():
        raise ValidationError("El Asesor de origen y destino no pueden ser el mismo.")

    # 5. Encriptación obligatoria para cruzar con la BD
    usrcodigo_origen_enc = encriptar(str(usrcodigo_origen).strip())
    usrcodigo_destino_enc = encriptar(str(usrcodigo_destino).strip())

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Iniciamos el bloque transaccional (BEGIN TRAN)[cite: 23]
        with connection.begin():

            # --- A. TRANSFERENCIA NIVEL 1: CARTERA DE CLIENTES ---
            # Insertamos en el destino solo los clientes del origen que el destino AÚN NO TENGA
            sql_insert_n1 = text(
                """
                INSERT INTO gdoc_usuariocliente (
                    ciacodigo, usrcodigo, clientecodigo, hereda_documentos, estado,
                    fecisys, horisys, usuisys, estisys
                )
                SELECT
                    o.ciacodigo, :usr_destino, o.clientecodigo, o.hereda_documentos, o.estado,
                    :fecisys, :horisys, :usuisys, :estisys
                FROM gdoc_usuariocliente o
                WHERE o.ciacodigo = :cia
                  AND o.usrcodigo = :usr_origen
                  AND NOT EXISTS (
                      SELECT 1 FROM gdoc_usuariocliente d
                      WHERE d.ciacodigo = o.ciacodigo
                        AND d.usrcodigo = :usr_destino
                        AND d.clientecodigo = o.clientecodigo
                  )
                """
            )
            res_n1 = connection.execute(
                sql_insert_n1,
                {
                    "cia": sCodCia,
                    "usr_origen": usrcodigo_origen_enc,
                    "usr_destino": usrcodigo_destino_enc,
                    "fecisys": fecha_pura,
                    "horisys": hora_pura,
                    "usuisys": str(sUsuario)[:10],
                    "estisys": str(sNomEst)[:40],
                },
            )
            clientes_transferidos = res_n1.rowcount

            # --- B. TRANSFERENCIA NIVEL 2: PERMISOS DE DOCUMENTOS ---
            # Insertamos en el destino solo los permisos de documentos que el destino AÚN NO TENGA
            sql_insert_n2 = text(
                """
                INSERT INTO gdoc_usuariodocumento (
                    ciacodigo, usrcodigo, documentouuid, permiso_ver
                )
                SELECT
                    o.ciacodigo, :usr_destino, o.documentouuid, o.permiso_ver
                FROM gdoc_usuariodocumento o
                WHERE o.ciacodigo = :cia
                  AND o.usrcodigo = :usr_origen
                  AND NOT EXISTS (
                      SELECT 1 FROM gdoc_usuariodocumento d
                      WHERE d.ciacodigo = o.ciacodigo
                        AND d.usrcodigo = :usr_destino
                        AND d.documentouuid = o.documentouuid
                  )
                """
            )
            res_n2 = connection.execute(
                sql_insert_n2,
                {
                    "cia": sCodCia,
                    "usr_origen": usrcodigo_origen_enc,
                    "usr_destino": usrcodigo_destino_enc,
                },
            )
            documentos_transferidos = res_n2.rowcount

            # --- C. LIMPIEZA DEL ASESOR ORIGEN ---
            # Borramos primero los documentos (hijos) y luego los clientes (padres) del origen
            sql_del_n2 = text(
                """
                DELETE FROM gdoc_usuariodocumento
                WHERE ciacodigo = :cia AND usrcodigo = :usr_origen
                """
            )
            connection.execute(sql_del_n2, {"cia": sCodCia, "usr_origen": usrcodigo_origen_enc})

            sql_del_n1 = text(
                """
                DELETE FROM gdoc_usuariocliente
                WHERE ciacodigo = :cia AND usrcodigo = :usr_origen
                """
            )
            connection.execute(sql_del_n1, {"cia": sCodCia, "usr_origen": usrcodigo_origen_enc})

            if clientes_transferidos == 0:
                # Si llega a cero, el origen no tenía clientes para transferir, pero igual limpiamos su cartera por seguridad.
                return {"data": "El usuario origen no tenía clientes nuevos para transferir."}

    # Retorno exitoso si el bloque BEGIN TRAN hizo el COMMIT correctamente
    return {"data": f"Transferencia exitosa. Se asignaron {clientes_transferidos} clientes y {documentos_transferidos} permisos de documentos al usuario destino."}
