from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.AsignacionDeClientesAUsu import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de encriptación
from services.encrip_desencrip import encriptar


@bp.route("/getDocumentosCliente", methods=["POST"])
@jwt_required()
@api_endpoint
def getDocumentosCliente():
    # 1. Extracción de sesión
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Recepción de parámetros
    data = request.get_json()
    usrcodigo_select = data.get("usrcodigo")
    clicodigo_select = data.get("clicodigo")

    # Si faltan parámetros clave, retornamos arreglo vacío
    if not usrcodigo_select or not clicodigo_select:
        return {"data": []}

    # Encriptamos el código del usuario para hacer match en la base de datos
    usrcodigo_encriptado = encriptar(str(usrcodigo_select).strip())

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 3. Consulta Híbrida (Directos + Eventos)
        sql = text(
            """
            SELECT
                d.documentouuid,
                -- Lógica condicional para armar el nombre completo
                CASE
                    WHEN UPPER(d.docextension) = 'CLV' THEN
                        d.docnombre + ' ' + ISNULL(i.instidescri, '') + ' ' + ISNULL(tc.cladescri, '')
                    ELSE
                        d.docnombre
                END as docnombre,
                d.docextension,  /* Para que el frontend separe en Pestañas: Documentos vs Claves */
                COALESCE(ud.permiso_ver, 0) as permiso_ver
            FROM gdocmdocumentos d
            -- Join de permisos
            LEFT JOIN gdoc_usuariodocumento ud
                ON d.ciacodigo = ud.ciacodigo
               AND d.documentouuid = ud.documentouuid
               AND ud.usrcodigo = :usrcodigo
            -- Join para traer el nombre de la Institución (Respetando multi-compañía)
            LEFT JOIN gdocbinstituciones i
                ON d.insticodigo = i.insticodigo
            -- Join para traer el nombre del Tipo de Clave (Respetando multi-compañía)
            LEFT JOIN gdocbTipoClaves tc
                ON d.clacodigo = tc.clacodigo
            WHERE d.ciacodigo = :cia
              AND d.docestisys = 'A'
              -- Aquí ampliamos la búsqueda: Documentos del cliente directo O de sus eventos
              AND (
                  d.docqgenero = :clicodigo
                  OR d.docqgenero IN (
                      SELECT eventocodigo
                      FROM gdocmeventos
                      WHERE ciacodigo = :cia AND clicodigo = :clicodigo
                  )
              )
            ORDER BY
                d.docextension ASC,
                -- Se ordena por el nombre real o concatenado
                CASE
                    WHEN UPPER(d.docextension) = 'CLV' THEN d.docnombre + ' ' + ISNULL(i.instidescri, '') + ' ' + ISNULL(tc.cladescri, '')
                    ELSE d.docnombre
                END ASC
            """
        )

        result = (
            connection.execute(
                sql,
                {
                    "cia": sCodCia,
                    "usrcodigo": usrcodigo_encriptado,  # Usamos la variable encriptada
                    "clicodigo": clicodigo_select,
                },
            )
            .mappings()
            .all()
        )

        lista_documentos = []
        for r in result:
            lista_documentos.append(
                {
                    "documentouuid": r["documentouuid"],
                    "docnombre": r["docnombre"] if r["docnombre"] else "SIN DESCRIPCIÓN",
                    "docextension": r["docextension"] if r["docextension"] else "DOC",
                    # Transformamos el valor de SQL a Booleano para el Checkbox de React
                    "permiso_ver": bool(r["permiso_ver"]),
                }
            )

    return {"data": lista_documentos}
