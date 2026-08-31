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
    # 1. Extracción de sesión y variables globales
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras de auditoría
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    # 3. Recepción de datos del Frontend
    data = request.get_json()
    usrcodigo_origen = data.get("usrcodigo_origen")
    usrcodigo_destino = data.get("usrcodigo_destino")
    clientes_seleccionados = data.get("clientes_seleccionados", [])

    # 4. Validaciones de negocio
    if not usrcodigo_origen or str(usrcodigo_origen).strip() == "":
        raise ValidationError("Debe seleccionar un Asesor de Origen.")
    if not usrcodigo_destino or str(usrcodigo_destino).strip() == "":
        raise ValidationError("Debe seleccionar un Asesor de Destino.")
    if str(usrcodigo_origen).strip() == str(usrcodigo_destino).strip():
        raise ValidationError("El Asesor de origen y destino no pueden ser el mismo.")
    if not clientes_seleccionados or not isinstance(clientes_seleccionados, list) or len(clientes_seleccionados) == 0:
        raise ValidationError("Debe especificar al menos un cliente para transferir.")

    # 5. Encriptación obligatoria para cruzar con la BD
    usrcodigo_origen_enc = encriptar(str(usrcodigo_origen).strip())
    usrcodigo_destino_enc = encriptar(str(usrcodigo_destino).strip())

    # 6. Preparación dinámica de la cláusula IN para los clientes seleccionados
    placeholders_clientes = []
    params = {
        "cia": sCodCia,
        "usr_origen": usrcodigo_origen_enc,
        "usr_destino": usrcodigo_destino_enc,
        "fecisys": fecha_pura,
        "horisys": hora_pura,
        "usuisys": str(sUsuario)[:10],
        "estisys": str(sNomEst)[:40],
    }

    for idx, cli in enumerate(clientes_seleccionados):
        key = f"cli_{idx}"
        placeholders_clientes.append(f":{key}")
        params[key] = str(cli)

    in_clause_clientes = ", ".join(placeholders_clientes)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Iniciamos el bloque transaccional (BEGIN TRAN)
        with connection.begin():

            # --- A. TRANSFERENCIA NIVEL 1: CARTERA DE CLIENTES SELECCIONADOS ---
            sql_insert_n1 = text(
                f"""
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
                  AND o.clientecodigo IN ({in_clause_clientes})
                  AND NOT EXISTS (
                      SELECT 1 FROM gdoc_usuariocliente d
                      WHERE d.ciacodigo = o.ciacodigo
                        AND d.usrcodigo = :usr_destino
                        AND d.clientecodigo = o.clientecodigo
                  )
                """
            )
            res_n1 = connection.execute(sql_insert_n1, params)
            clientes_transferidos = res_n1.rowcount

            # --- B. TRANSFERENCIA NIVEL 2: PERMISOS DE DOCUMENTOS ASOCIADOS A LOS CLIENTES ---
            sql_insert_n2 = text(
                f"""
                INSERT INTO gdoc_usuariodocumento (
                    ciacodigo, usrcodigo, documentouuid, permiso_ver
                )
                SELECT
                    o.ciacodigo, :usr_destino, o.documentouuid, o.permiso_ver
                FROM gdoc_usuariodocumento o
                INNER JOIN gdocmdocumentos doc
                        ON o.documentouuid = doc.documentouuid
                       AND o.ciacodigo = doc.ciacodigo
                WHERE o.ciacodigo = :cia
                  AND o.usrcodigo = :usr_origen
                  AND doc.docqgenero IN ({in_clause_clientes})
                  AND NOT EXISTS (
                      SELECT 1 FROM gdoc_usuariodocumento d
                      WHERE d.ciacodigo = o.ciacodigo
                        AND d.usrcodigo = :usr_destino
                        AND d.documentouuid = o.documentouuid
                  )
                """
            )
            res_n2 = connection.execute(sql_insert_n2, params)
            documentos_transferidos = res_n2.rowcount

            # --- C. LIMPIEZA DEL ASESOR ORIGEN (Solo los clientes seleccionados) ---
            sql_del_n2 = text(
                f"""
                DELETE FROM gdoc_usuariodocumento
                WHERE ciacodigo = :cia
                  AND usrcodigo = :usr_origen
                  AND documentouuid IN (
                      SELECT documentouuid
                      FROM gdocmdocumentos
                      WHERE ciacodigo = :cia
                        AND docqgenero IN ({in_clause_clientes})
                  )
                """
            )
            connection.execute(sql_del_n2, params)

            sql_del_n1 = text(
                f"""
                DELETE FROM gdoc_usuariocliente
                WHERE ciacodigo = :cia
                  AND usrcodigo = :usr_origen
                  AND clientecodigo IN ({in_clause_clientes})
                """
            )
            connection.execute(sql_del_n1, params)

            if clientes_transferidos == 0:
                return {"data": "Los clientes seleccionados ya se encontraban en la cartera del asesor destino."}

    return {"data": f"Transferencia exitosa. Se asignaron {clientes_transferidos} clientes y {documentos_transferidos} permisos de documentos al usuario destino."}
