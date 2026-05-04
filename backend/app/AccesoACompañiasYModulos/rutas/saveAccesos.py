from flask import jsonify, request
from app.AccesoACompañiasYModulos import bp
from app.extensions import db
from flask_cors import cross_origin
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


@bp.route("/saveAccesos", methods=["POST"])
@cross_origin()
@jwt_required()
def saveAccesos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # CONSTANTES
    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    sFecISys = fecha_con_hora_cero

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    sHorISys = fecha_formato_1900

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    accesos = data.get("data", [])
    txtUsrCodigo = data.get("txtUsrCodigo")
    esPerfilValue = int(data.get("esPerfilValue"))
    updateAllAccesosPerfiles = data.get("updateAllAccesosPerfiles", False)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():

                for acceso in accesos:
                    sCia = acceso["compania"]
                    sMod = acceso["modulo"]
                    sAccion = acceso["accion"]

                    # 'Flag para Insertar en la nueva tabla de usuarios WEB   -- 13/Junio/2023 --
                    bFlagSiactUsrWeb = False
                    if sMod.upper() == "WEB":
                        bFlagSiactUsrWeb = True

                    # 'Inserto el Registro si es Creación para que se cumpla la inserción de la Audición
                    if sAccion == "CREATE":
                        insert_query = text(
                            """
                            INSERT INTO siactusr (usrcodigo,usrfecisys,usrhorisys,usrusuisys,usrestisys,
                                                usraccion,ciacodigo,modcodigo,usracceso)
                            VALUES(:usrcodigo, :fecisys, :horisys, :usuisys, :estisys,
                                :accion, :ciacodigo, :modcodigo, :acceso)
                            """
                        )
                        connection.execute(insert_query, {"usrcodigo": encriptar(txtUsrCodigo), "fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "accion": sAccion, "ciacodigo": sCia, "modcodigo": sMod, "acceso": ""})

                    # Actualizo el Registro sólo si es Modificación para que se cumpla la inserción de la Audición
                    if sAccion == "UPDATE":
                        update_query = text(
                            """
                            UPDATE siactusr
                            SET usrfecisys = :fecisys,
                                usrhorisys = :horisys,
                                usrusuisys = :usuisys,
                                usrestisys = :estisys,
                                usraccion = :accion
                            WHERE usrcodigo = :usrcodigo
                                AND ciacodigo = :ciacodigo
                                AND modcodigo = :modcodigo
                            """
                        )
                        connection.execute(update_query, {"fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "accion": sAccion, "usrcodigo": encriptar(txtUsrCodigo), "ciacodigo": sCia, "modcodigo": sMod})

                    # Elimino lo Auditado para Insertar Nuevo Registro solo si es Diferente de Creación
                    if sAccion == "DELETE":
                        delete_query = text(
                            """
                            DELETE FROM siactusr
                            WHERE usrcodigo = :usrcodigo
                                AND ciacodigo = :ciacodigo
                                AND modcodigo = :modcodigo
                            """
                        )
                        connection.execute(delete_query, {"usrcodigo": encriptar(txtUsrCodigo), "ciacodigo": sCia, "modcodigo": sMod})

                        # --
                        # -- Usuarios Web    -- GPN -- 13/Junio/2023 --
                        # --
                        if bFlagSiactUsrWeb:
                            # Si Aplica Elimino los accesos previos para insertar los nuevos en la tabla de Usuarios Web
                            delete_web_query = text(
                                """
                                DELETE FROM SiactUsrWeb
                                WHERE usrcodigo = :usrcodigo
                                    AND ciacodigo = :ciacodigo
                                    AND modcodigo = :modcodigo
                                """
                            )
                            connection.execute(delete_web_query, {"usrcodigo": encriptar(txtUsrCodigo), "ciacodigo": sCia, "modcodigo": sMod})

                        # --
                        # -- Confirmado con Edgar vía WhatsApp dice que se deben eliminar los accesos a Locales  -- GPN -- 30/Julio/2021 --
                        # --

                        # --
                        # -- Audito el Acceso a Localidad si fue Eliminación
                        # -- los campos de audición "isys" no existian x eso se cambian guardando los "msys" de siactloc
                        # -- esto a partir del -- 02/Dic/2009 -- GPN -- los datos anteriores se deben actualizar
                        # --
                        insert_audit_query = text(
                            """
                            INSERT INTO siachtloc (
                                ciacodigo,usrcodigo,loccodigo,locfecisys,lochorisys,
                                locusuisys,usrflagcaj,usrcajdesc,usrflagsup,usrsupdesc,usrflagger,
                                usrgerdesc,usrmonaprocom,usrflaganuped,usrflaganufac,usrflageliant,usrflagelicob,
                                usrflagemiped,usrflagemifac,usrflagemicob,usrflagemiab,usrflagemincd,usrflagemincm,
                                usrflagemidg,usrflagemind,usrflagemitrainv,usrflagemicominv,usrflagemicomser,
                                usrflagemigasaso,usrflagemipagpro,usrflagemipagdir,usrflagemiantpro,usrflaganuordcom,
                                usrflaganugasaso,usrflaganupagpro,usrflaganupagdir,usrflaganucheque,usrflagemicobrel,
                                usrflagemindmor,usrflagemindref,usrflagemindces,usrflagivapedido,usrflagvencedg,
                                usrflagvencegift,usrflagemifaccxp,usrflagemindcxp,usrflageminccxp,usrflagmodcredito,usrmontolineacre,
                                usrflagaprproyecto,usrflagcrucecta,usrflaganuproforma,usrflagclicomenta,usrflagclicreahis,usrflagclielihis,
                                usrflagrentabilidadped,usrflagdescuentoglobal,usrflagvercostoinvcomp,usrflagmodificaarticulo,
                                locestisys,locaccion,locfecmsys,lochormsys,locusumsys,locestmsys
                            )
                            SELECT
                                ciacodigo,usrcodigo,loccodigo,locfecmsys,lochormsys,locusumsys,
                                usrflagcaj,usrcajdesc,usrflagsup,usrsupdesc,usrflagger,usrgerdesc,usrmonaprocom,
                                usrflaganuped,usrflaganufac,usrflageliant,usrflagelicob,usrflagemiped,usrflagemifac,
                                usrflagemicob,usrflagemiab,usrflagemincd,usrflagemincm,usrflagemidg,usrflagemind,
                                usrflagemitrainv,usrflagemicominv,usrflagemicomser,usrflagemigasaso,usrflagemipagpro,
                                usrflagemipagdir,usrflagemiantpro,usrflaganuordcom,usrflaganugasaso,usrflaganupagpro,
                                usrflaganupagdir,usrflaganucheque,usrflagemicobrel,usrflagemindmor,usrflagemindref,
                                usrflagemindces,usrflagivapedido,usrflagvencedg,usrflagvencegift,usrflagemifaccxp,
                                usrflagemindcxp,usrflageminccxp,usrflagmodcredito,usrmontolineacre,usrflagaprproyecto,usrflagcrucecta,
                                usrflaganuproforma,usrflagclicomenta,usrflagclicreahis,usrflagclielihis,usrflagrentabilidadped,
                                usrflagdescuentoglobal,usrflagvercostoinvcomp,usrflagmodificaarticulo,locestmsys,:accion,
                                :fecisys, :horisys, :usuisys, :estisys
                            FROM siactloc
                            WHERE usrcodigo = :usrcodigo
                                AND ciacodigo = :ciacodigo
                            """
                        )
                        connection.execute(insert_audit_query, {"accion": sAccion, "fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "usrcodigo": encriptar(txtUsrCodigo), "ciacodigo": sCia})

                        # Elimino el Registro que estaba seleccionado y ahora no
                        delete_loc_query = text(
                            """
                            DELETE FROM siactloc
                            WHERE usrcodigo = :usrcodigo
                                AND ciacodigo = :ciacodigo
                            """
                        )
                        connection.execute(delete_loc_query, {"usrcodigo": encriptar(txtUsrCodigo), "ciacodigo": sCia})

                if esPerfilValue != 0:
                    # Busco los Usuarios que correspondan a este Perfil
                    rstTmpPer = connection.execute(
                        text(
                            """
                        SELECT usrcodigo
                        FROM siaccusr
                        WHERE usrcodper = :usrcodper
                        """
                        ),
                        {"usrcodper": encriptar(txtUsrCodigo)},
                    ).fetchall()

                    if len(rstTmpPer) > 0:
                        if updateAllAccesosPerfiles:
                            # --
                            # -- Proceso con los Accesos a Compañía y Módulo
                            # --

                            # Cargo los accesos del Perfil para luego validar cuales accesos se actualizan o eliminan
                            rstPerfil = connection.execute(
                                text(
                                    """
                                SELECT ciacodigo, ciadescri, modcodigo, moddescri,
                                    usracceso, usrfecisys, usrhorisys, usrusuisys, usrestisys
                                FROM view_seg_acceso_usuarios
                                WHERE usrcodigo = :usrcodigo
                                """
                                ),
                                {"usrcodigo": encriptar(txtUsrCodigo)},
                            ).fetchall()

                            # Barro los Usuarios con este Perfil para hacer las respectivas actualizaciones
                            # el USRCODIGO ya está encriptado
                            for usuario in rstTmpPer:
                                usrcodigo = usuario[0]

                                # Cargo los accesos del Usuario si los tuviere
                                rstTmp = connection.execute(
                                    text(
                                        """
                                    SELECT ciacodigo, ciadescri, modcodigo, moddescri,
                                        usracceso, usrfecisys, usrhorisys, usrusuisys, usrestisys
                                    FROM view_seg_acceso_usuarios
                                    WHERE usrcodigo = :usrcodigo
                                    """
                                    ),
                                    {"usrcodigo": usrcodigo},
                                ).fetchall()

                                for acceso in rstTmp:
                                    sAccion = "UPDATE"
                                    sAccesoPerfil = ""

                                    # Busco los accesos del Perfil para luego validar cuales accesos se actualizan o eliminan
                                    acceso_perfil = [ap for ap in rstPerfil if ap[0] == acceso[0] and ap[2] == acceso[2]]

                                    if len(acceso_perfil) <= 0:
                                        sAccion = "DELETE"  # Si el Perfil no tiene el acceso del Usuario es Eliminación
                                    else:
                                        sAccesoPerfil = acceso_perfil[0][4] if acceso_perfil[0][4] is not None else ""

                                    # Actualizo el Registro sólo si es Modificación tomando los accesos del Perfil en sAccesoPerfil
                                    if sAccion == "UPDATE":
                                        update_query = text(
                                            """
                                            UPDATE siactusr
                                            SET usrfecisys = :fecisys,
                                                usrhorisys = :horisys,
                                                usrusuisys = :usuisys,
                                                usrestisys = :estisys,
                                                usraccion = :accion,
                                                usracceso = :acceso
                                            WHERE usrcodigo = :usrcodigo
                                                AND ciacodigo = :ciacodigo
                                                AND modcodigo = :modcodigo
                                            """
                                        )
                                        connection.execute(update_query, {"fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "accion": sAccion, "acceso": sAccesoPerfil, "usrcodigo": usrcodigo, "ciacodigo": acceso[0], "modcodigo": acceso[2]})

                                    # Audito los accesos del Usuario si los tuviere
                                    insert_audit_query = text(
                                        """
                                        INSERT INTO siachtusr (
                                            ciacodigo, usrcodigo, modcodigo, usracceso,
                                            usrfecisys, usrhorisys, usrusuisys, usrestisys, usraccion, usrfecmsys,
                                            usrhormsys, usrusumsys, usrestmsys
                                        )
                                        SELECT
                                            ciacodigo, usrcodigo, modcodigo, usracceso, usrfecisys, usrhorisys,
                                            usrusuisys, usrestisys, :accion, :fecmsys,
                                            :horamsys, :usumsys, :estmsys
                                        FROM siactusr
                                        WHERE usrcodigo = :usrcodigo
                                            AND ciacodigo = :ciacodigo
                                            AND modcodigo = :modcodigo
                                        """
                                    )
                                    connection.execute(insert_audit_query, {"accion": sAccion, "fecmsys": sFecISys, "horamsys": sHorISys, "usumsys": sUsuario, "estmsys": sNomEst, "usrcodigo": usrcodigo, "ciacodigo": acceso[0], "modcodigo": acceso[2]})

                                    # Elimino los accesos actuales que no corresponden a los del Perfil
                                    if sAccion == "DELETE":
                                        delete_query = text(
                                            """
                                            DELETE FROM siactusr
                                            WHERE usrcodigo = :usrcodigo
                                                AND ciacodigo = :ciacodigo
                                                AND modcodigo = :modcodigo
                                            """
                                        )
                                        connection.execute(delete_query, {"usrcodigo": usrcodigo, "ciacodigo": acceso[0], "modcodigo": acceso[2]})

                                        # --
                                        # -- Confirmado con Edgar vía WhatsApp dice que se deben eliminar los accesos a Locales  -- GPN -- 30/Julio/2021 --
                                        # --

                                        # --
                                        # -- Audito el Acceso a Localidad si fue Eliminación
                                        # -- los campos de audición "isys" no existian x eso se cambian guardando los "msys" de siactloc
                                        # -- esto a partir del -- 02/Dic/2009 -- GPN -- los datos anteriores se deben actualizar
                                        # --
                                        insert_loc_audit_query = text(
                                            """
                                            INSERT INTO siachtloc (
                                                ciacodigo, usrcodigo, loccodigo, locfecisys, lochorisys,
                                                locusuisys, usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger,
                                                usrgerdesc, usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                                usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd, usrflagemincm,
                                                usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv, usrflagemicomser,
                                                usrflagemigasaso, usrflagemipagpro, usrflagemipagdir, usrflagemiantpro, usrflaganuordcom,
                                                usrflaganugasaso, usrflaganupagpro, usrflaganupagdir, usrflaganucheque, usrflagemicobrel,
                                                usrflagemindmor, usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                                usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp, usrflagmodcredito, usrmontolineacre,
                                                usrflagaprproyecto, usrflagcrucecta, usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                                usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp, usrflagmodificaarticulo,
                                                locestisys, locaccion, locfecmsys, lochormsys, locusumsys, locestmsys
                                            )
                                            SELECT
                                                ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys,
                                                usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc, usrmonaprocom,
                                                usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob, usrflagemiped, usrflagemifac,
                                                usrflagemicob, usrflagemiab, usrflagemincd, usrflagemincm, usrflagemidg, usrflagemind,
                                                usrflagemitrainv, usrflagemicominv, usrflagemicomser, usrflagemigasaso, usrflagemipagpro,
                                                usrflagemipagdir, usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                                usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor, usrflagemindref,
                                                usrflagemindces, usrflagivapedido, usrflagvencedg, usrflagvencegift, usrflagemifaccxp,
                                                usrflagemindcxp, usrflageminccxp, usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                                usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis, usrflagrentabilidadped,
                                                usrflagdescuentoglobal, usrflagvercostoinvcomp, usrflagmodificaarticulo, locestmsys, :accion,
                                                :fecisys, :horisys, :usuisys, :estisys
                                            FROM siactloc
                                            WHERE usrcodigo = :usrcodigo
                                                AND ciacodigo = :ciacodigo
                                            """
                                        )
                                        connection.execute(insert_loc_audit_query, {"accion": sAccion, "fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "usrcodigo": usrcodigo, "ciacodigo": acceso[0]})

                                        # Elimino el Registro que estaba seleccionado y ahora no
                                        delete_loc_query = text(
                                            """
                                            DELETE FROM siactloc
                                            WHERE usrcodigo = :usrcodigo
                                                AND ciacodigo = :ciacodigo
                                            """
                                        )
                                        connection.execute(delete_loc_query, {"usrcodigo": usrcodigo, "ciacodigo": acceso[0]})

                                # Deshago el último filtro del Perfil para buscar si hay q insertar accesos
                                for perfil in rstPerfil:
                                    sAccesoPerfil = perfil[4] if perfil[4] is not None else ""

                                    # Verificar si el usuario tiene este acceso
                                    usuario_tiene_acceso = any(acc[0] == perfil[0] and acc[2] == perfil[2] for acc in rstTmp)

                                    if not usuario_tiene_acceso:
                                        # Inserto los Nuevos accesos desde el Perfil
                                        insert_query = text(
                                            """
                                            INSERT INTO siactusr (
                                                usrcodigo, usrfecisys, usrhorisys, usrusuisys, usrestisys,
                                                usraccion, ciacodigo, modcodigo, usracceso
                                            )
                                            VALUES (
                                                :usrcodigo, :fecisys, :horisys, :usuisys, :estisys,
                                                'CREATE', :ciacodigo, :modcodigo, :acceso
                                            )
                                            """
                                        )
                                        connection.execute(insert_query, {"usrcodigo": usrcodigo, "fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "ciacodigo": perfil[0], "modcodigo": perfil[2], "acceso": sAccesoPerfil})

                                        # Audito los accesos del Usuario si los tuviere
                                        insert_audit_new_query = text(
                                            """
                                            INSERT INTO siachtusr (
                                                ciacodigo, usrcodigo, modcodigo, usracceso,
                                                usrfecisys, usrhorisys, usrusuisys, usrestisys, usraccion, usrfecmsys,
                                                usrhormsys, usrusumsys, usrestmsys
                                            )
                                            SELECT
                                                ciacodigo, usrcodigo, modcodigo, usracceso, usrfecisys, usrhorisys,
                                                usrusuisys, usrestisys, 'CREATE', :fecmsys,
                                                :horamsys, :usumsys, :estmsys
                                            FROM siactusr
                                            WHERE usrcodigo = :usrcodigo
                                                AND ciacodigo = :ciacodigo
                                                AND modcodigo = :modcodigo
                                            """
                                        )
                                        connection.execute(insert_audit_new_query, {"fecmsys": sFecISys, "horamsys": sHorISys, "usumsys": sUsuario, "estmsys": sNomEst, "usrcodigo": usrcodigo, "ciacodigo": perfil[0], "modcodigo": perfil[2]})

                                # --
                                # -- Usuarios Web    -- GPN -- 13/Junio/2023 --
                                # --
                                if bFlagSiactUsrWeb:
                                    # Si Aplica Elimino los accesos previos para insertar los nuevos en la tabla de Usuarios Web
                                    for perfil in rstPerfil:
                                        delete_web_query = text(
                                            """
                                            DELETE FROM SiactUsrWeb
                                            WHERE usrcodigo = :usrcodigo
                                                AND ciacodigo = :ciacodigo
                                                AND modcodigo = :modcodigo
                                            """
                                        )
                                        connection.execute(delete_web_query, {"usrcodigo": usrcodigo, "ciacodigo": perfil[0], "modcodigo": perfil[2]})

                                        # Inserto los nuevos accesos a menú
                                        # La fecha no la menciono porque la Base de Datos la pone por defecto
                                        insert_web_query = text(
                                            """
                                            INSERT INTO SiactUsrWeb (
                                                ciacodigo, usrcodigo, modcodigo, opctag,
                                                usrusuisys, usrestisys, id_item
                                            )
                                            SELECT
                                                ciacodigo, :usrcodigo, modcodigo, opctag,
                                                usrusuisys, usrestisys, id_item
                                            FROM SiactUsrWeb
                                            WHERE usrcodigo = :perfilcodigo
                                                AND ciacodigo = :ciacodigo
                                                AND modcodigo = :modcodigo
                                            """
                                        )
                                        connection.execute(insert_web_query, {"usrcodigo": usrcodigo, "perfilcodigo": encriptar(txtUsrCodigo), "ciacodigo": perfil[0], "modcodigo": perfil[2]})
        return jsonify({"data": {"msg": "Guardado con éxito"}}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": {"msg": str(e)}}), 400
