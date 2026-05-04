from flask import jsonify, request
from app.CreacionUsuarios import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from services.encrip_desencrip import encriptar
from sqlalchemy import text
from datetime import datetime
import base64


def grabaFecha(fecha_str):
    """
    Convierte una fecha en formato ISO 8601 (con hora) a solo la fecha (sin la hora).
    Ejemplo: "2025-02-19T03:47:59.371Z" -> "2025-02-19"

    :param fecha_str: Fecha en formato ISO 8601 (ej. "2025-02-19T03:47:59.371Z")
    :return: Fecha en formato 'YYYY-MM-DD'
    """
    # Reemplazar 'Z' por '+00:00' para que sea un formato válido para fromisoformat
    fecha_obj = datetime.fromisoformat(fecha_str.replace("Z", "+00:00"))

    # Devolver solo la fecha (sin hora)
    return fecha_obj.date()


def existe_tabla(connection, tabla):
    """Verifica si una tabla existe en la base de datos."""
    query = text(
        """
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = :table_name
    """
    )
    result = connection.execute(query, {"table_name": tabla})
    exists = result.fetchone() is not None
    return exists


# Este api creo o actuliza un usuario
@bp.route("/upsertUsuario", methods=["POST"])
@cross_origin()
@jwt_required()
def upsertUsuario():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # usrflagupdateperfilacces = 0 #TODO: POR EL MOMENOT COMENTADO

    # Obtener la fecha actual con la hora seteada en 00:00:00
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Obtener la fecha con formato de 1900-01-01 y la hora actual
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    txtUsrCodigo = data.get("usrcodigo")
    txtUsrNombre = data.get("usrnombre")
    dtpUsrFecCadValue = data.get("usrfeccad")
    usrstatus = data.get("usrstatus")
    dcbPerfilBoundedText = data.get("usrcodper")
    txtUsremail = data.get("usremail")
    iFlagOfiCre = -1 if data.get("usrflagoficre") else 0
    iFlagPerfil = -1 if data.get("usrflagperfil") else 0
    txtDiasCaduClaveText = data.get("usrdiascaduclave")
    usrimagen = base64.b64decode(data.get("usrimagen")) if data.get("usrimagen") else None

    optBusValue = data.get("optBus", True)
    optBusCliValue = data.get("optBusCli", True)
    optBusProValue = data.get("optBusPro", True)

    sFecISys = fecha_con_hora_cero
    sHorISys = fecha_formato_1900
    FechaDelSistema = fecha_con_hora_cero

    sOpcion = data.get("sOpcion")
    usrflagupdateperfilacces = data.get("usrflagupdateperfilacces", False)

    usrcodigoreporta = data.get("usuarioReporta", "")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    try:
        with engine.connect() as connection:
            with connection.begin():
                if sOpcion == "NEW":
                    data_siaccusr = {
                        "usrcodigo": encriptar(txtUsrCodigo.strip()),
                        "usrnombre": encriptar(txtUsrNombre.strip()),
                        "usrclave": encriptar(txtUsrCodigo.strip()),
                        "usrfeccad": grabaFecha(dtpUsrFecCadValue),
                        "usrstatus": encriptar(usrstatus),
                        "usrfecisys": sFecISys,
                        "usrhorisys": sHorISys,
                        "usrusuisys": sUsuario,
                        "usrfecmsys": sFecISys,
                        "usrhormsys": sHorISys,
                        "usrusumsys": sUsuario,
                        "usrflagoficre": int(iFlagOfiCre),
                        "usrhelpart": "B" if optBusValue else "T",
                        "usrhelpcli": "B" if optBusCliValue else "T",
                        "usrcodper": encriptar(dcbPerfilBoundedText.strip() if dcbPerfilBoundedText else ""),
                        "usrflagperfil": int(iFlagPerfil),
                        "usrhelppro": "B" if optBusProValue else "T",
                        "usremail": txtUsremail or "",
                        "usrimagen": usrimagen,
                        "usrestisys": sNomEst,
                        "usrestmsys": sNomEst,
                        "usrdiascaduclave": int(txtDiasCaduClaveText) if txtDiasCaduClaveText else 0,
                        "usrfecactuclave": FechaDelSistema,
                        "usrflagnuevmodi": 1,
                        "usrcodigoreporta": usrcodigoreporta,
                    }

                    insert_query = text(
                        """
                        INSERT INTO siaccusr (
                            usrcodigo, usrnombre, usrclave, usrfeccad, usrstatus,
                            usrfecisys, usrhorisys, usrusuisys, usrfecmsys, usrhormsys, usrusumsys,
                            usrflagoficre, usrhelpart, usrhelpcli, usrcodper, usrflagperfil, usrhelppro,
                            usremail, usrestisys, usrestmsys, usrdiascaduclave, usrfecactuclave, usrflagnuevmodi, usrcodigoreporta
                        ) VALUES (
                            :usrcodigo, :usrnombre, :usrclave, :usrfeccad, :usrstatus,
                            :usrfecisys, :usrhorisys, :usrusuisys, :usrfecmsys, :usrhormsys, :usrusumsys,
                            :usrflagoficre, :usrhelpart, :usrhelpcli, :usrcodper, :usrflagperfil, :usrhelppro,
                            :usremail, :usrestisys, :usrestmsys, :usrdiascaduclave, :usrfecactuclave, :usrflagnuevmodi, :usrcodigoreporta
                        )
                    """
                    )

                    connection.execute(insert_query, data_siaccusr)

                    # TODO: Inserto en la tabla SIACTLOC los permisos por defecto para el nuevo usuario (esta consulta de siactloc no estaba en el codigo origanl de vb)
                    data_siactloc = {
                        # CLAVES PRIMARIAS Y OBLIGATORIAS
                        "ciacodigo": sCodCia,  # VARCHAR(2) - NOT NULL
                        "usrcodigo": encriptar(txtUsrCodigo.strip()),  # VARCHAR(10) - NOT NULL
                        "loccodigo": "01",  # VARCHAR(3) - NOT NULL
                        # CAMPOS DE AUDITORÍA - OBLIGATORIOS
                        "locfecmsys": sFecISys,  # DATETIME - NOT NULL
                        "lochormsys": sHorISys,  # DATETIME - NOT NULL
                        "locusumsys": sUsuario,  # VARCHAR(10) - NOT NULL
                        # CAMPOS CON VALORES POR DEFECTO - FLAGS NUMÉRICOS
                        "usrflagcaj": 0,  # INT - DEFAULT 0
                        "usrcajdesc": 0.00,  # DECIMAL(6,2) - DEFAULT 0.00
                        "usrflagsup": 0,  # INT - DEFAULT 0
                        "usrsupdesc": 0.00,  # DECIMAL(6,2) - DEFAULT 0.00
                        "usrflagger": 0,  # INT - DEFAULT 0
                        "usrgerdesc": 0.00,  # DECIMAL(6,2) - DEFAULT 0.00
                        "usrmonaprocom": 0.00,  # DECIMAL(18,2) - DEFAULT 0.00
                        "usrflaganuped": 0,  # INT - DEFAULT 0
                        "usrflaganufac": 0,  # INT - DEFAULT 0
                        "usrflageliant": 0,  # INT - DEFAULT 0
                        "usrflagelicob": 0,  # INT - DEFAULT 0
                        "usrflagemiped": 0,  # INT - DEFAULT 0
                        "usrflagemifac": 0,  # INT - DEFAULT 0
                        "usrflagemicob": 0,  # INT - DEFAULT 0
                        "usrflagemiab": 0,  # INT - DEFAULT 0
                        "usrflagemincd": 0,  # INT - DEFAULT 0
                        "usrflagemincm": 0,  # INT - DEFAULT 0
                        "usrflagemidg": 0,  # INT - DEFAULT 0
                        "usrflagemind": 0,  # INT - DEFAULT 0
                        "usrflagemitrainv": 0,  # INT - DEFAULT 0
                        "usrflagemicominv": 0,  # INT - DEFAULT 0
                        "usrflagemicomser": 0,  # INT - DEFAULT 0
                        "usrflagemigasaso": 0,  # INT - DEFAULT 0
                        "usrflagemipagpro": 0,  # INT - DEFAULT 0
                        "usrflagemipagdir": 0,  # INT - DEFAULT 0
                        "usrflagemiantpro": 0,  # INT - DEFAULT 0
                        "usrflaganuordcom": 0,  # INT - DEFAULT 0
                        "usrflaganugasaso": 0,  # INT - DEFAULT 0
                        "usrflaganupagpro": 0,  # INT - DEFAULT 0
                        "usrflaganupagdir": 0,  # INT - DEFAULT 0
                        "usrflaganucheque": 0,  # INT - DEFAULT 0
                        "usrflagemicobrel": 0,  # INT - DEFAULT 0
                        "usrflagemindmor": 0,  # INT - DEFAULT 0
                        "usrflagemindref": 0,  # INT - DEFAULT 0
                        "usrflagemindces": 0,  # INT - DEFAULT 0
                        "usrflagivapedido": 0,  # INT - DEFAULT 0
                        "usrflagvencedg": 0,  # INT - DEFAULT 0
                        "usrflagvencegift": 0,  # INT - DEFAULT 0
                        "usrflagemifaccxp": 0,  # INT - DEFAULT 0
                        "usrflagemindcxp": 0,  # INT - DEFAULT 0
                        "usrflageminccxp": 0,  # INT - DEFAULT 0
                        "usrflagmodcredito": 0,  # INT - DEFAULT 0
                        "usrmontolineacre": 0.00,  # DECIMAL(18,2) - DEFAULT 0
                        "usrflagaprproyecto": 0,  # INT - DEFAULT 0
                        "usrflagcrucecta": 0,  # INT - DEFAULT 0
                        "usrflaganuproforma": 0,  # INT - DEFAULT 0
                        "usrflagclicomenta": 0,  # INT - DEFAULT 0
                        "usrflagclicreahis": 0,  # INT - DEFAULT 0
                        "usrflagclielihis": 0,  # INT - DEFAULT 0
                        "usrflagrentabilidadped": 0,  # INT - DEFAULT 0
                        "usrflagdescuentoglobal": 0,  # INT - DEFAULT 0
                        "usrflagvercostoinvcomp": 0,  # INT - DEFAULT 0
                        "usrflagmodificaarticulo": 0,  # INT - DEFAULT 0
                        # CAMPOS OPCIONALES (NULLABLE)
                        "locestmsys": sNomEst,  # VARCHAR(40) - NULL
                        "locaccion": "NEW",  # VARCHAR(6) - NULL
                    }

                    # QUERY COMPLETO DE INSERCIÓN
                    insert_siactloc_query = text(
                        """
                        INSERT INTO siactloc (
                            ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys,
                            usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                            usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                            usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                            usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                            usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                            usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                            usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                            usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                            usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                            usrflagmodcredito, usrmontolineacre, locestmsys, locaccion, usrflagaprproyecto,
                            usrflagcrucecta, usrflaganuproforma, usrflagclicomenta, usrflagclicreahis,
                            usrflagclielihis, usrflagrentabilidadped, usrflagdescuentoglobal,
                            usrflagvercostoinvcomp, usrflagmodificaarticulo
                        ) VALUES (
                            :ciacodigo, :usrcodigo, :loccodigo, :locfecmsys, :lochormsys, :locusumsys,
                            :usrflagcaj, :usrcajdesc, :usrflagsup, :usrsupdesc, :usrflagger, :usrgerdesc,
                            :usrmonaprocom, :usrflaganuped, :usrflaganufac, :usrflageliant, :usrflagelicob,
                            :usrflagemiped, :usrflagemifac, :usrflagemicob, :usrflagemiab, :usrflagemincd,
                            :usrflagemincm, :usrflagemidg, :usrflagemind, :usrflagemitrainv, :usrflagemicominv,
                            :usrflagemicomser, :usrflagemigasaso, :usrflagemipagpro, :usrflagemipagdir,
                            :usrflagemiantpro, :usrflaganuordcom, :usrflaganugasaso, :usrflaganupagpro,
                            :usrflaganupagdir, :usrflaganucheque, :usrflagemicobrel, :usrflagemindmor,
                            :usrflagemindref, :usrflagemindces, :usrflagivapedido, :usrflagvencedg,
                            :usrflagvencegift, :usrflagemifaccxp, :usrflagemindcxp, :usrflageminccxp,
                            :usrflagmodcredito, :usrmontolineacre, :locestmsys, :locaccion, :usrflagaprproyecto,
                            :usrflagcrucecta, :usrflaganuproforma, :usrflagclicomenta, :usrflagclicreahis,
                            :usrflagclielihis, :usrflagrentabilidadped, :usrflagdescuentoglobal,
                            :usrflagvercostoinvcomp, :usrflagmodificaarticulo
                        )
                    """
                    )

                    connection.execute(insert_siactloc_query, data_siactloc)

                # Actualizo el Registro
                if sOpcion == "Edit":
                    data_siaccusr_update = {
                        "usrnombre": encriptar(txtUsrNombre.strip()),
                        "usrfeccad": grabaFecha(dtpUsrFecCadValue),
                        "usrstatus": encriptar(usrstatus),
                        "usrfecmsys": sFecISys,
                        "usrhormsys": sHorISys,
                        "usrusumsys": sUsuario,
                        "usrflagoficre": int(iFlagOfiCre),
                        "usrhelpart": "B" if optBusValue else "T",
                        "usrhelpcli": "B" if optBusCliValue else "T",
                        "usrcodper": encriptar(dcbPerfilBoundedText.strip() if dcbPerfilBoundedText else ""),
                        "usrflagperfil": int(iFlagPerfil),
                        "usrhelppro": "B" if optBusProValue else "T",
                        "usremail": txtUsremail or "",
                        "usrestmsys": sNomEst,
                        "usrdiascaduclave": int(txtDiasCaduClaveText) if txtDiasCaduClaveText else 0,
                        "usrcodigo_where": encriptar(txtUsrCodigo.strip()),
                        "usrcodigoreporta": usrcodigoreporta,
                    }

                    update_query = text(
                        """
                        UPDATE siaccusr SET
                            usrnombre = :usrnombre,
                            usrfeccad = :usrfeccad,
                            usrstatus = :usrstatus,
                            usrfecmsys = :usrfecmsys,
                            usrhormsys = :usrhormsys,
                            usrusumsys = :usrusumsys,
                            usrflagoficre = :usrflagoficre,
                            usrhelpart = :usrhelpart,
                            usrhelpcli = :usrhelpcli,
                            usrcodper = :usrcodper,
                            usrflagperfil = :usrflagperfil,
                            usrhelppro = :usrhelppro,
                            usremail = :usremail,
                            usrestmsys = :usrestmsys,
                            usrdiascaduclave = :usrdiascaduclave,
                            usrcodigoreporta = :usrcodigoreporta
                        WHERE usrcodigo = :usrcodigo_where
                    """
                    )

                    connection.execute(update_query, data_siaccusr_update)

                query_initial = text(
                    """
                    SELECT cliciagrupo, cliciaidenti
                    FROM [SiacFSBS].dbo.fsbsmclicia
                    INNER JOIN siaccia ON cliciaruc = ciaruc
                    WHERE ciacodigo = :ciacodigo
                """
                )

                result_initial = connection.execute(query_initial, {"ciacodigo": sCodCia})
                rstTmp = result_initial.fetchone()

                if rstTmp:
                    sCliCiaGrupo = rstTmp.cliciagrupo.strip() if rstTmp.cliciagrupo is not None else ""
                    iCliCiaIdenti = rstTmp.cliciaidenti if rstTmp.cliciaidenti is not None else 0

                    # Averiguo si el Usuario existe en la BD SIACFSBS para Crear/Actualizar
                    query_check_user = text(
                        """
                        SELECT cliciausu
                        FROM SiacFSBS.dbo.fsbsmcliusu
                        WHERE cliciausu = :cliciausu
                            AND cliciagrupo = :cliciagrupo
                            AND cliciaidenti = :cliciaidenti
                    """
                    )

                    result_user = connection.execute(query_check_user, {"cliciausu": encriptar(txtUsrCodigo.strip()), "cliciagrupo": sCliCiaGrupo, "cliciaidenti": iCliCiaIdenti})
                    adorstSiaccUsr = result_user.fetchone()

                    if not adorstSiaccUsr:
                        # Inserto en la Base de Datos SIACFSBS en la tabla fsbsmcliusu
                        data_insert = {
                            "cliciausu": encriptar(txtUsrCodigo.strip()),
                            "cliciagrupo": rstTmp.cliciagrupo,
                            "cliciaidenti": iCliCiaIdenti,
                            "cliciausustatus": encriptar(usrstatus),
                            "cliusufecisys": sFecISys,
                            "cliusufecmsys": sFecISys,
                            "cliusuusuisys": sUsuario,
                            "cliusuusumsys": sUsuario,
                            "cliusuestisys": sNomEst,
                            "cliusuestmsys": sNomEst,
                        }

                        insert_query = text(
                            """
                            INSERT INTO SiacFSBS.dbo.fsbsmcliusu (
                                cliciausu, cliciagrupo, cliciaidenti, cliciausustatus,
                                cliusufecisys, cliusufecmsys, cliusuusuisys, cliusuusumsys,
                                cliusuestisys, cliusuestmsys
                            ) VALUES (
                                :cliciausu, :cliciagrupo, :cliciaidenti, :cliciausustatus,
                                :cliusufecisys, :cliusufecmsys, :cliusuusuisys, :cliusuusumsys,
                                :cliusuestisys, :cliusuestmsys
                            )
                        """
                        )
                        connection.execute(insert_query, data_insert)
                    else:
                        # Actualizo el registro existente
                        data_update = {"cliciausustatus": encriptar(usrstatus), "cliusufecmsys": sFecISys, "cliusuusumsys": sUsuario, "cliusuestmsys": sNomEst, "cliciausu": encriptar(txtUsrCodigo.strip()), "cliciagrupo": sCliCiaGrupo, "cliciaidenti": iCliCiaIdenti}

                        update_query = text(
                            """
                            UPDATE SiacFSBS.dbo.fsbsmcliusu
                            SET cliciausustatus = :cliciausustatus,
                                cliusufecmsys = :cliusufecmsys,
                                cliusuusumsys = :cliusuusumsys,
                                cliusuestmsys = :cliusuestmsys
                            WHERE cliciausu = :cliciausu
                                AND cliciagrupo = :cliciagrupo
                                AND cliciaidenti = :cliciaidenti
                        """
                        )
                        connection.execute(update_query, data_update)

                # 'Audito un registro después de Insertar/Actualizar, aumenté las estaciones de ingreso/modificación  -- GPN -- 02/Agosto/2010 --
                audit_query = text(
                    """
                    INSERT INTO siachcusr (
                        usrcodigo, usrnombre, usrclave, usrfeccad, usrstatus,
                        usrfecisys, usrfecmsys, usrhorisys, usrhormsys, usrusuisys, usrusumsys,
                        usrflagoficre, usrhelpart, usrhelpcli, usrcodper, usrflagperfil, usrflagnuevmodi,
                        usrdiascaduclave, usrfecactuclave, usrhelppro, usremail, usrestisys, usrestmsys
                    )
                    SELECT
                        usrcodigo, usrnombre, usrclave, usrfeccad, usrstatus,
                        usrfecisys, usrfecmsys, usrhorisys, usrhormsys, usrusuisys, usrusumsys,
                        usrflagoficre, usrhelpart, usrhelpcli, usrcodper, usrflagperfil, usrflagnuevmodi,
                        usrdiascaduclave, usrfecactuclave, usrhelppro, usremail, usrestisys, usrestmsys
                    FROM siaccusr
                    WHERE usrcodigo = :usrcodigo
                """
                )

                connection.execute(audit_query, {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                # -- Si el usuario tiene un perfil asignado y el flag de perfil está activo, actualizo los accesos del usuario según el perfil --
                # Verificamos la condición inicial
                if iFlagPerfil == 0 and dcbPerfilBoundedText is not None and usrstatus == "A":

                    # Función de confirmación (debes implementar según tu framework)
                    if usrflagupdateperfilacces:
                        # -- Proceso con los Accesos a Compañía y Módulo --

                        # Cargo los accesos del Perfil
                        query_perfil = text(
                            """
                            SELECT ciacodigo, ciadescri, modcodigo, moddescri, usracceso,
                                usrfecisys, usrhorisys, usrusuisys, usrestisys
                            FROM view_seg_acceso_usuarios
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        rstPerfil = connection.execute(query_perfil, {"usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())}).fetchall()

                        # Cargo los accesos del Usuario
                        query_usuario = text(
                            """
                            SELECT ciacodigo, ciadescri, modcodigo, moddescri, usracceso,
                                usrfecisys, usrhorisys, usrusuisys, usrestisys
                            FROM view_seg_acceso_usuarios
                            WHERE usrcodigo = :usrcodigo_usuario
                        """
                        )
                        rstTmp = connection.execute(query_usuario, {"usrcodigo_usuario": encriptar(txtUsrCodigo.strip())}).fetchall()

                        # Procesar accesos existentes del usuario
                        for usuario_row in rstTmp:
                            sAccion = "UPDATE"
                            sAccesoPerfil = ""

                            # Buscar acceso correspondiente en el perfil
                            perfil_row = next((p for p in rstPerfil if p.ciacodigo == usuario_row.ciacodigo and p.modcodigo == usuario_row.modcodigo), None)

                            if not perfil_row:
                                sAccion = "DELETE"
                            else:
                                sAccesoPerfil = perfil_row.usracceso or ""

                            # Auditoría
                            audit_query = text(
                                """
                                INSERT INTO siachtusr (
                                    ciacodigo, usrcodigo, modcodigo, usracceso, usrfecisys, usrhorisys,
                                    usrusuisys, usrestisys, usraccion, usrfecmsys, usrhormsys, usrusumsys, usrestmsys
                                )
                                SELECT
                                    ciacodigo, usrcodigo, modcodigo, usracceso, usrfecisys, usrhorisys,
                                    usrusuisys, usrestisys, :accion, :fecmsys, :hormsys, :usumsys, :estmsys
                                FROM siactusr
                                WHERE usrcodigo = :usrcodigo
                                    AND ciacodigo = :ciacodigo
                                    AND modcodigo = :modcodigo
                            """
                            )
                            connection.execute(audit_query, {"accion": sAccion, "fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "estmsys": sNomEst, "usrcodigo": encriptar(txtUsrCodigo.strip()), "ciacodigo": usuario_row.ciacodigo, "modcodigo": usuario_row.modcodigo})

                            # Eliminar o actualizar
                            if sAccion == "DELETE":
                                delete_query = text(
                                    """
                                    DELETE FROM siactusr
                                    WHERE usrcodigo = :usrcodigo
                                        AND ciacodigo = :ciacodigo
                                        AND modcodigo = :modcodigo
                                """
                                )
                                connection.execute(delete_query, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "ciacodigo": usuario_row.ciacodigo, "modcodigo": usuario_row.modcodigo})
                            else:  # UPDATE
                                update_query = text(
                                    """
                                    UPDATE siactusr SET
                                        usrfecisys = :fecisys, usrhorisys = :horisys,
                                        usrusuisys = :usuisys, usrestisys = :estisys,
                                        usraccion = :accion, usracceso = :acceso
                                    WHERE usrcodigo = :usrcodigo
                                        AND ciacodigo = :ciacodigo
                                        AND modcodigo = :modcodigo
                                """
                                )
                                connection.execute(
                                    update_query, {"fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "accion": sAccion, "acceso": sAccesoPerfil, "usrcodigo": encriptar(txtUsrCodigo.strip()), "ciacodigo": usuario_row.ciacodigo, "modcodigo": usuario_row.modcodigo}
                                )

                        # Insertar nuevos accesos desde el perfil
                        for perfil_row in rstPerfil:
                            # Verificar si el usuario ya tiene este acceso
                            usuario_tiene_acceso = any(u for u in rstTmp if u.ciacodigo == perfil_row.ciacodigo and u.modcodigo == perfil_row.modcodigo)

                            if not usuario_tiene_acceso:
                                sAccesoPerfil = perfil_row.usracceso or ""

                                # Insertar nuevo acceso
                                insert_query = text(
                                    """
                                    INSERT INTO siactusr (
                                        usrcodigo, usrfecisys, usrhorisys, usrusuisys, usrestisys,
                                        usraccion, ciacodigo, modcodigo, usracceso
                                    ) VALUES (
                                        :usrcodigo, :fecisys, :horisys, :usuisys, :estisys,
                                        :accion, :ciacodigo, :modcodigo, :acceso
                                    )
                                """
                                )
                                connection.execute(
                                    insert_query, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "fecisys": sFecISys, "horisys": sHorISys, "usuisys": sUsuario, "estisys": sNomEst, "accion": "CREATE", "ciacodigo": perfil_row.ciacodigo, "modcodigo": perfil_row.modcodigo, "acceso": sAccesoPerfil}
                                )

                                # Auditoría del nuevo acceso
                                audit_query = text(
                                    """
                                    INSERT INTO siachtusr (
                                        ciacodigo, usrcodigo, modcodigo, usracceso, usrfecisys, usrhorisys,
                                        usrusuisys, usrestisys, usraccion, usrfecmsys, usrhormsys, usrusumsys, usrestmsys
                                    )
                                    SELECT
                                        ciacodigo, usrcodigo, modcodigo, usracceso, usrfecisys, usrhorisys,
                                        usrusuisys, usrestisys, 'CREATE', :fecmsys, :hormsys, :usumsys, :estmsys
                                    FROM siactusr
                                    WHERE usrcodigo = :usrcodigo
                                        AND ciacodigo = :ciacodigo
                                        AND modcodigo = :modcodigo
                                """
                                )
                                connection.execute(audit_query, {"fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "estmsys": sNomEst, "usrcodigo": encriptar(txtUsrCodigo.strip()), "ciacodigo": perfil_row.ciacodigo, "modcodigo": perfil_row.modcodigo})

                        # -- Proceso con los Accesos a Localidades --

                        # Cargo los accesos del Perfil para localidades
                        query_perfil_loc = text(
                            """
                            SELECT ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys,
                                usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                                usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                                usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                                usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                                usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                                usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                                usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp,
                                usrflagmodificaarticulo, locestmsys, locaccion
                            FROM siactloc
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        rstPerfil_loc = connection.execute(query_perfil_loc, {"usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())}).fetchall()

                        # Cargo los accesos del Usuario para localidades
                        query_usuario_loc = text(
                            """
                            SELECT ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys,
                                usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                                usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                                usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                                usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                                usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                                usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                                usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp,
                                usrflagmodificaarticulo, locestmsys, locaccion
                            FROM siactloc
                            WHERE usrcodigo = :usrcodigo_usuario
                        """
                        )
                        rstTmp_loc = connection.execute(query_usuario_loc, {"usrcodigo_usuario": encriptar(txtUsrCodigo.strip())}).fetchall()

                        # Procesar accesos a localidades existentes del usuario
                        for usuario_row in rstTmp_loc:
                            sAccion = "UPDATE"

                            # Buscar acceso correspondiente en el perfil
                            perfil_row = next((p for p in rstPerfil_loc if p.ciacodigo == usuario_row.ciacodigo and p.loccodigo == usuario_row.loccodigo), None)

                            if not perfil_row:
                                sAccion = "DELETE"

                            # Auditoría de localidades
                            audit_loc_query = text(
                                """
                                INSERT INTO siachtloc (
                                    ciacodigo, usrcodigo, loccodigo, locfecisys, lochorisys, locusuisys,
                                    usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                                    usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                    usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                                    usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                                    usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                                    usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                    usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                                    usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                    usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                                    usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                    usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                    usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp,
                                    usrflagmodificaarticulo, locestisys, locaccion, locfecmsys, lochormsys, locusumsys, locestmsys
                                )
                                SELECT
                                    ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys,
                                    usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                                    usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                    usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                                    usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                                    usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                                    usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                    usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                                    usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                    usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                                    usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                    usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                    usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp,
                                    usrflagmodificaarticulo, locestmsys, :accion, :fecisys, :horisys, :suisys, :estisys
                                FROM siactloc
                                WHERE usrcodigo = :usrcodigo
                                    AND ciacodigo = :ciacodigo
                                    AND loccodigo = :loccodigo
                            """
                            )
                            connection.execute(audit_loc_query, {"accion": sAccion, "fecisys": sFecISys, "horisys": sHorISys, "suisys": sUsuario, "estisys": sNomEst, "usrcodigo": encriptar(txtUsrCodigo.strip()), "ciacodigo": usuario_row.ciacodigo, "loccodigo": usuario_row.loccodigo})

                            # Eliminar o actualizar localidad
                            if sAccion == "DELETE":
                                delete_loc_query = text(
                                    """
                                    DELETE FROM siactloc
                                    WHERE usrcodigo = :usrcodigo
                                        AND ciacodigo = :ciacodigo
                                        AND loccodigo = :loccodigo
                                """
                                )
                                connection.execute(delete_loc_query, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "ciacodigo": usuario_row.ciacodigo, "loccodigo": usuario_row.loccodigo})
                            else:  # UPDATE
                                update_loc_query = text(
                                    """
                                    UPDATE siactloc SET
                                        usrflagcaj = :flagcaj, usrcajdesc = :cajdesc, usrflagsup = :flagsup,
                                        usrsupdesc = :supdesc, usrflagger = :flagger, usrgerdesc = :gerdesc,
                                        usrmonaprocom = :monaprocom, usrflaganuped = :flaganuped,
                                        usrflaganufac = :flaganufac, usrflageliant = :flageliant,
                                        usrflagelicob = :flagelicob, usrflagemiped = :flagemiped,
                                        usrflagemifac = :flagemifac, usrflagemicob = :flagemicob,
                                        usrflagemiab = :flagemiab, usrflagemincd = :flagemincd,
                                        usrflagemincm = :flagemincm, usrflagemidg = :flagemidg,
                                        usrflagemind = :flagemind, usrflagemitrainv = :flagemitrainv,
                                        usrflagemicominv = :flagemicominv, usrflagemicomser = :flagemicomser,
                                        usrflagemigasaso = :flagemigasaso, usrflagemipagpro = :flagemipagpro,
                                        usrflagemipagdir = :flagemipagdir, usrflagemiantpro = :flagemiantpro,
                                        usrflaganuordcom = :flaganuordcom, usrflaganugasaso = :flaganugasaso,
                                        usrflaganupagpro = :flaganupagpro, usrflaganupagdir = :flaganupagdir,
                                        usrflaganucheque = :flaganucheque, usrflagemicobrel = :flagemicobrel,
                                        usrflagemindmor = :flagemindmor, usrflagemindref = :flagemindref,
                                        usrflagemindces = :flagemindces, usrflagivapedido = :flagivapedido,
                                        usrflagvencedg = :flagvencedg, usrflagvencegift = :flagvencegift,
                                        usrflagemifaccxp = :flagemifaccxp, usrflagemindcxp = :flagemindcxp,
                                        usrflageminccxp = :flageminccxp, usrflagmodcredito = :flagmodcredito,
                                        usrmontolineacre = :montolineacre, usrflagaprproyecto = :flagaprproyecto,
                                        usrflagcrucecta = :flagcrucecta, usrflaganuproforma = :flaganuproforma,
                                        usrflagclicomenta = :flagclicomenta, usrflagclicreahis = :flagclicreahis,
                                        usrflagclielihis = :flagclielihis, usrflagrentabilidadped = :flagrentabilidadped,
                                        usrflagdescuentoglobal = :flagdescuentoglobal, usrflagvercostoinvcomp = :flagvercostoinvcomp,
                                        usrflagmodificaarticulo = :flagmodificaarticulo, locfecmsys = :fecmsys,
                                        lochormsys = :hormsys, locusumsys = :usumsys, locestmsys = :estmsys,
                                        locaccion = :accion
                                    WHERE usrcodigo = :usrcodigo
                                        AND ciacodigo = :ciacodigo
                                        AND loccodigo = :loccodigo
                                """
                                )
                                connection.execute(
                                    update_loc_query,
                                    {
                                        "flagcaj": perfil_row.usrflagcaj,
                                        "cajdesc": perfil_row.usrcajdesc,
                                        "flagsup": perfil_row.usrflagsup,
                                        "supdesc": perfil_row.usrsupdesc,
                                        "flagger": perfil_row.usrflagger,
                                        "gerdesc": perfil_row.usrgerdesc,
                                        "monaprocom": perfil_row.usrmonaprocom,
                                        "flaganuped": perfil_row.usrflaganuped,
                                        "flaganufac": perfil_row.usrflaganufac,
                                        "flageliant": perfil_row.usrflageliant,
                                        "flagelicob": perfil_row.usrflagelicob,
                                        "flagemiped": perfil_row.usrflagemiped,
                                        "flagemifac": perfil_row.usrflagemifac,
                                        "flagemicob": perfil_row.usrflagemicob,
                                        "flagemiab": perfil_row.usrflagemiab,
                                        "flagemincd": perfil_row.usrflagemincd,
                                        "flagemincm": perfil_row.usrflagemincm,
                                        "flagemidg": perfil_row.usrflagemidg,
                                        "flagemind": perfil_row.usrflagemind,
                                        "flagemitrainv": perfil_row.usrflagemitrainv,
                                        "flagemicominv": perfil_row.usrflagemicominv,
                                        "flagemicomser": perfil_row.usrflagemicomser,
                                        "flagemigasaso": perfil_row.usrflagemigasaso,
                                        "flagemipagpro": perfil_row.usrflagemipagpro,
                                        "flagemipagdir": perfil_row.usrflagemipagdir,
                                        "flagemiantpro": perfil_row.usrflagemiantpro,
                                        "flaganuordcom": perfil_row.usrflaganuordcom,
                                        "flaganugasaso": perfil_row.usrflaganugasaso,
                                        "flaganupagpro": perfil_row.usrflaganupagpro,
                                        "flaganupagdir": perfil_row.usrflaganupagdir,
                                        "flaganucheque": perfil_row.usrflaganucheque,
                                        "flagemicobrel": perfil_row.usrflagemicobrel,
                                        "flagemindmor": perfil_row.usrflagemindmor,
                                        "flagemindref": perfil_row.usrflagemindref,
                                        "flagemindces": perfil_row.usrflagemindces,
                                        "flagivapedido": perfil_row.usrflagivapedido,
                                        "flagvencedg": perfil_row.usrflagvencedg,
                                        "flagvencegift": perfil_row.usrflagvencegift,
                                        "flagemifaccxp": perfil_row.usrflagemifaccxp,
                                        "flagemindcxp": perfil_row.usrflagemindcxp,
                                        "flageminccxp": perfil_row.usrflageminccxp,
                                        "flagmodcredito": perfil_row.usrflagmodcredito,
                                        "montolineacre": perfil_row.usrmontolineacre,
                                        "flagaprproyecto": perfil_row.usrflagaprproyecto,
                                        "flagcrucecta": perfil_row.usrflagcrucecta,
                                        "flaganuproforma": perfil_row.usrflaganuproforma,
                                        "flagclicomenta": perfil_row.usrflagclicomenta,
                                        "flagclicreahis": perfil_row.usrflagclicreahis,
                                        "flagclielihis": perfil_row.usrflagclielihis,
                                        "flagrentabilidadped": perfil_row.usrflagrentabilidadped,
                                        "flagdescuentoglobal": perfil_row.usrflagdescuentoglobal,
                                        "flagvercostoinvcomp": perfil_row.usrflagvercostoinvcomp,
                                        "flagmodificaarticulo": perfil_row.usrflagmodificaarticulo,
                                        "fecmsys": sFecISys,
                                        "hormsys": sHorISys,
                                        "usumsys": sUsuario,
                                        "estmsys": sNomEst,
                                        "accion": sAccion,
                                        "usrcodigo": encriptar(txtUsrCodigo.strip()),
                                        "ciacodigo": usuario_row.ciacodigo,
                                        "loccodigo": usuario_row.loccodigo,
                                    },
                                )

                        # Insertar nuevas localidades desde el perfil
                        for perfil_row in rstPerfil_loc:
                            # Verificar si el usuario ya tiene esta localidad
                            usuario_tiene_localidad = any(u for u in rstTmp_loc if u.ciacodigo == perfil_row.ciacodigo and u.loccodigo == perfil_row.loccodigo)

                            if not usuario_tiene_localidad:
                                # Insertar nueva localidad
                                insert_loc_query = text(
                                    """
                                    INSERT INTO siactloc (
                                        ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys,
                                        usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                                        usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                        usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                                        usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                                        usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                                        usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                        usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                                        usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                        usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                                        usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                        usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                        usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp,
                                        usrflagmodificaarticulo, locestmsys, locaccion
                                    ) VALUES (
                                        :ciacodigo, :usrcodigo, :loccodigo, :fecmsys, :hormsys, :usumsys,
                                        :flagcaj, :cajdesc, :flagsup, :supdesc, :flagger, :gerdesc,
                                        :monaprocom, :flaganuped, :flaganufac, :flageliant, :flagelicob,
                                        :flagemiped, :flagemifac, :flagemicob, :flagemiab, :flagemincd,
                                        :flagemincm, :flagemidg, :flagemind, :flagemitrainv, :flagemicominv,
                                        :flagemicomser, :flagemigasaso, :flagemipagpro, :flagemipagdir,
                                        :flagemiantpro, :flaganuordcom, :flaganugasaso, :flaganupagpro,
                                        :flaganupagdir, :flaganucheque, :flagemicobrel, :flagemindmor,
                                        :flagemindref, :flagemindces, :flagivapedido, :flagvencedg,
                                        :flagvencegift, :flagemifaccxp, :flagemindcxp, :flageminccxp,
                                        :flagmodcredito, :montolineacre, :flagaprproyecto, :flagcrucecta,
                                        :flaganuproforma, :flagclicomenta, :flagclicreahis, :flagclielihis,
                                        :flagrentabilidadped, :flagdescuentoglobal, :flagvercostoinvcomp,
                                        :flagmodificaarticulo, :estmsys, :accion
                                    )
                                """
                                )
                                connection.execute(
                                    insert_loc_query,
                                    {
                                        "ciacodigo": perfil_row.ciacodigo,
                                        "usrcodigo": encriptar(txtUsrCodigo.strip()),
                                        "loccodigo": perfil_row.loccodigo,
                                        "fecmsys": sFecISys,
                                        "hormsys": sHorISys,
                                        "usumsys": sUsuario,
                                        "flagcaj": perfil_row.usrflagcaj,
                                        "cajdesc": perfil_row.usrcajdesc,
                                        "flagsup": perfil_row.usrflagsup,
                                        "supdesc": perfil_row.usrsupdesc,
                                        "flagger": perfil_row.usrflagger,
                                        "gerdesc": perfil_row.usrgerdesc,
                                        "monaprocom": perfil_row.usrmonaprocom,
                                        "flaganuped": perfil_row.usrflaganuped,
                                        "flaganufac": perfil_row.usrflaganufac,
                                        "flageliant": perfil_row.usrflageliant,
                                        "flagelicob": perfil_row.usrflagelicob,
                                        "flagemiped": perfil_row.usrflagemiped,
                                        "flagemifac": perfil_row.usrflagemifac,
                                        "flagemicob": perfil_row.usrflagemicob,
                                        "flagemiab": perfil_row.usrflagemiab,
                                        "flagemincd": perfil_row.usrflagemincd,
                                        "flagemincm": perfil_row.usrflagemincm,
                                        "flagemidg": perfil_row.usrflagemidg,
                                        "flagemind": perfil_row.usrflagemind,
                                        "flagemitrainv": perfil_row.usrflagemitrainv,
                                        "flagemicominv": perfil_row.usrflagemicominv,
                                        "flagemicomser": perfil_row.usrflagemicomser,
                                        "flagemigasaso": perfil_row.usrflagemigasaso,
                                        "flagemipagpro": perfil_row.usrflagemipagpro,
                                        "flagemipagdir": perfil_row.usrflagemipagdir,
                                        "flagemiantpro": perfil_row.usrflagemiantpro,
                                        "flaganuordcom": perfil_row.usrflaganuordcom,
                                        "flaganugasaso": perfil_row.usrflaganugasaso,
                                        "flaganupagpro": perfil_row.usrflaganupagpro,
                                        "flaganupagdir": perfil_row.usrflaganupagdir,
                                        "flaganucheque": perfil_row.usrflaganucheque,
                                        "flagemicobrel": perfil_row.usrflagemicobrel,
                                        "flagemindmor": perfil_row.usrflagemindmor,
                                        "flagemindref": perfil_row.usrflagemindref,
                                        "flagemindces": perfil_row.usrflagemindces,
                                        "flagivapedido": perfil_row.usrflagivapedido,
                                        "flagvencedg": perfil_row.usrflagvencedg,
                                        "flagvencegift": perfil_row.usrflagvencegift,
                                        "flagemifaccxp": perfil_row.usrflagemifaccxp,
                                        "flagemindcxp": perfil_row.usrflagemindcxp,
                                        "flageminccxp": perfil_row.usrflageminccxp,
                                        "flagmodcredito": perfil_row.usrflagmodcredito,
                                        "montolineacre": perfil_row.usrmontolineacre,
                                        "flagaprproyecto": perfil_row.usrflagaprproyecto,
                                        "flagcrucecta": perfil_row.usrflagcrucecta,
                                        "flaganuproforma": perfil_row.usrflaganuproforma,
                                        "flagclicomenta": perfil_row.usrflagclicomenta,
                                        "flagclicreahis": perfil_row.usrflagclicreahis,
                                        "flagclielihis": perfil_row.usrflagclielihis,
                                        "flagrentabilidadped": perfil_row.usrflagrentabilidadped,
                                        "flagdescuentoglobal": perfil_row.usrflagdescuentoglobal,
                                        "flagvercostoinvcomp": perfil_row.usrflagvercostoinvcomp,
                                        "flagmodificaarticulo": perfil_row.usrflagmodificaarticulo,
                                        "estmsys": sNomEst,
                                        "accion": "CREATE",
                                    },
                                )

                                # Auditoría de la nueva localidad
                                audit_new_loc_query = text(
                                    """
                                    INSERT INTO siachtloc (
                                        ciacodigo, usrcodigo, loccodigo, locfecisys, lochorisys, locusuisys,
                                        usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                                        usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                        usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                                        usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                                        usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                                        usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                        usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                                        usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                        usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                                        usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                        usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                        usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp,
                                        usrflagmodificaarticulo, locestisys, locaccion, locfecmsys, lochormsys, locusumsys, locestmsys
                                    )
                                    SELECT
                                        ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys,
                                        usrflagcaj, usrcajdesc, usrflagsup, usrsupdesc, usrflagger, usrgerdesc,
                                        usrmonaprocom, usrflaganuped, usrflaganufac, usrflageliant, usrflagelicob,
                                        usrflagemiped, usrflagemifac, usrflagemicob, usrflagemiab, usrflagemincd,
                                        usrflagemincm, usrflagemidg, usrflagemind, usrflagemitrainv, usrflagemicominv,
                                        usrflagemicomser, usrflagemigasaso, usrflagemipagpro, usrflagemipagdir,
                                        usrflagemiantpro, usrflaganuordcom, usrflaganugasaso, usrflaganupagpro,
                                        usrflaganupagdir, usrflaganucheque, usrflagemicobrel, usrflagemindmor,
                                        usrflagemindref, usrflagemindces, usrflagivapedido, usrflagvencedg,
                                        usrflagvencegift, usrflagemifaccxp, usrflagemindcxp, usrflageminccxp,
                                        usrflagmodcredito, usrmontolineacre, usrflagaprproyecto, usrflagcrucecta,
                                        usrflaganuproforma, usrflagclicomenta, usrflagclicreahis, usrflagclielihis,
                                        usrflagrentabilidadped, usrflagdescuentoglobal, usrflagvercostoinvcomp,
                                        usrflagmodificaarticulo, locestmsys, 'CREATE', :fecisys, :horisys, :suisys, :estisys
                                    FROM siactloc
                                    WHERE usrcodigo = :usrcodigo
                                        AND ciacodigo = :ciacodigo
                                        AND loccodigo = :loccodigo
                                """
                                )
                                connection.execute(audit_new_loc_query, {"fecisys": sFecISys, "horisys": sHorISys, "suisys": sUsuario, "estisys": sNomEst, "usrcodigo": encriptar(txtUsrCodigo.strip()), "ciacodigo": perfil_row.ciacodigo, "loccodigo": perfil_row.loccodigo})

                        # -- Otros tipos de accesos --

                        # 1.- Acceso a Servicios de Cuentas por Cobrar
                        # Auditoría
                        connection.execute(
                            text(
                                """
                            INSERT INTO cxchser (ciacodigo, usrcodigo, serfecmsys, serhormsys, serusumsys, serestmsys, sercodigo)
                            SELECT ciacodigo, usrcodigo, serfecmsys, serhormsys, serusumsys, serestmsys, sercodigo
                            FROM cxcsser
                            WHERE usrcodigo = :usrcodigo
                        """
                            ),
                            {"usrcodigo": encriptar(txtUsrCodigo.strip())},
                        )

                        # Eliminar y insertar nuevos
                        connection.execute(text("DELETE FROM cxcsser WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                        insert_servicios = text(
                            """
                            INSERT INTO cxcsser (ciacodigo, usrcodigo, sercodigo, serfecmsys, serhormsys, serusumsys)
                            SELECT ciacodigo, :usrcodigo, sercodigo, :fecmsys, :hormsys, :usumsys
                            FROM cxcsser
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        connection.execute(insert_servicios, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())})

                        # 2.- Acceso a Centros de Costo
                        connection.execute(
                            text(
                                """
                            INSERT INTO cxphcencos (ciacodigo, usrcodigo, trafecmsys, trahormsys, trausumsys, traestmsys, coscodigo)
                            SELECT ciacodigo, usrcodigo, trafecmsys, trahormsys, trausumsys, traestmsys, coscodigo
                            FROM cxpscencos
                            WHERE usrcodigo = :usrcodigo
                        """
                            ),
                            {"usrcodigo": encriptar(txtUsrCodigo.strip())},
                        )

                        connection.execute(text("DELETE FROM cxpscencos WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                        insert_centros_costo = text(
                            """
                            INSERT INTO cxpscencos (ciacodigo, usrcodigo, coscodigo, trafecmsys, trahormsys, trausumsys)
                            SELECT ciacodigo, :usrcodigo, coscodigo, :fecmsys, :hormsys, :usumsys
                            FROM cxpscencos
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        connection.execute(insert_centros_costo, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())})

                        # 3.- Acceso a Tipos de Orden de Compra
                        connection.execute(
                            text(
                                """
                            INSERT INTO cxphtipoc (ciacodigo, usrcodigo, tipofecmsys, tipohormsys, tipousumsys, tipoestmsys, tipocodigo)
                            SELECT ciacodigo, usrcodigo, tipofecmsys, tipohormsys, tipousumsys, tipoestmsys, tipocodigo
                            FROM cxpstipoc
                            WHERE usrcodigo = :usrcodigo
                        """
                            ),
                            {"usrcodigo": encriptar(txtUsrCodigo.strip())},
                        )

                        connection.execute(text("DELETE FROM cxpstipoc WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                        insert_tipos_orden = text(
                            """
                            INSERT INTO cxpstipoc (ciacodigo, usrcodigo, tipocodigo, tipofecmsys, tipohormsys, tipousumsys)
                            SELECT ciacodigo, :usrcodigo, tipocodigo, :fecmsys, :hormsys, :usumsys
                            FROM cxpstipoc
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        connection.execute(insert_tipos_orden, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())})

                        # 4.- Acceso a Transacciones de Inventarios
                        connection.execute(
                            text(
                                """
                            INSERT INTO inhtran (ciacodigo, usrcodigo, trafecmsys, trahormsys, trausumsys, traestmsys, tracodigo)
                            SELECT ciacodigo, usrcodigo, trafecmsys, trahormsys, trausumsys, traestmsys, tracodigo
                            FROM instran
                            WHERE usrcodigo = :usrcodigo
                        """
                            ),
                            {"usrcodigo": encriptar(txtUsrCodigo.strip())},
                        )

                        connection.execute(text("DELETE FROM instran WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                        insert_transacciones = text(
                            """
                            INSERT INTO instran (ciacodigo, usrcodigo, tracodigo, trafecmsys, trahormsys, trausumsys)
                            SELECT ciacodigo, :usrcodigo, tracodigo, :fecmsys, :hormsys, :usumsys
                            FROM instran
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        connection.execute(insert_transacciones, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())})

                        # 5.- Acceso a Bodegas
                        connection.execute(
                            text(
                                """
                            INSERT INTO inhbod (ciacodigo, usrcodigo, bodfecmsys, bodhormsys, bodusumsys, bodestmsys, invcodigo, bodcodigo)
                            SELECT ciacodigo, usrcodigo, bodfecmsys, bodhormsys, bodusumsys, bodestmsys, invcodigo, bodcodigo
                            FROM insbod
                            WHERE usrcodigo = :usrcodigo
                        """
                            ),
                            {"usrcodigo": encriptar(txtUsrCodigo.strip())},
                        )

                        connection.execute(text("DELETE FROM insbod WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                        insert_bodegas = text(
                            """
                            INSERT INTO insbod (ciacodigo, usrcodigo, bodcodigo, invcodigo, bodfecmsys, bodhormsys, bodusumsys)
                            SELECT ciacodigo, :usrcodigo, bodcodigo, invcodigo, :fecmsys, :hormsys, :usumsys
                            FROM insbod
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        connection.execute(insert_bodegas, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())})

                        # 6.- Acceso a Comprobantes Contables
                        connection.execute(
                            text(
                                """
                            INSERT INTO cghcomp (ciacodigo, usrcodigo, compfecmsys, comphormsys, compusumsys, compestmsys, compcodigo)
                            SELECT ciacodigo, usrcodigo, compfecmsys, comphormsys, compusumsys, compestmsys, compcodigo
                            FROM cgscomp
                            WHERE usrcodigo = :usrcodigo
                        """
                            ),
                            {"usrcodigo": encriptar(txtUsrCodigo.strip())},
                        )

                        connection.execute(text("DELETE FROM cgscomp WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                        insert_comprobantes = text(
                            """
                            INSERT INTO cgscomp (ciacodigo, usrcodigo, compcodigo, compfecmsys, comphormsys, compusumsys)
                            SELECT ciacodigo, :usrcodigo, compcodigo, :fecmsys, :hormsys, :usumsys
                            FROM cgscomp
                            WHERE usrcodigo = :usrcodigo_perfil
                        """
                        )
                        connection.execute(insert_comprobantes, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "fecmsys": sFecISys, "hormsys": sHorISys, "usumsys": sUsuario, "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())})

                        # 7.- Accesos a Permiso de Formularios
                        if existe_tabla(connection, "siacopcuser"):
                            connection.execute(text("DELETE FROM siacopcuser WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                            insert_formularios = text(
                                """
                                INSERT INTO siacopcuser (
                                    ciacodigo, usrcodigo, opctag, opcformcod, opcuserfecisys, opcuserhorisys,
                                    opcuserusuisys, opcuserfecmsys, opcuserchormsys, opcuserusumsys, usrflagperfil
                                )
                                SELECT
                                    ciacodigo, :usrcodigo, opctag, opcformcod, :fecisys, :horisys,
                                    :usuisys, :fecmsys, :hormsys, :usumsys, :flagperfil
                                FROM siacopcuser
                                WHERE usrcodigo = :usrcodigo_perfil
                            """
                            )
                            connection.execute(
                                insert_formularios,
                                {
                                    "usrcodigo": encriptar(txtUsrCodigo.strip()),
                                    "fecisys": sFecISys,
                                    "horisys": sHorISys,
                                    "usuisys": sUsuario,
                                    "fecmsys": sFecISys,
                                    "hormsys": sHorISys,
                                    "usumsys": sUsuario,
                                    "flagperfil": 0,  # Ajustar según tu lógica
                                    "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip()),
                                },
                            )

                        # 8.- Usuarios Web
                        if existe_tabla(connection, "Siactusrweb"):
                            connection.execute(text("DELETE FROM SiactUsrWeb WHERE usrcodigo = :usrcodigo"), {"usrcodigo": encriptar(txtUsrCodigo.strip())})

                            insert_usuarios_web = text(
                                """
                                INSERT INTO SiactUsrWeb (ciacodigo, usrcodigo, modcodigo, opctag, usrusuisys, usrestisys, id_item)
                                SELECT ciacodigo, :usrcodigo, modcodigo, opctag, :usuisys, :estisys, id_item
                                FROM SiactUsrWeb
                                WHERE usrcodigo = :usrcodigo_perfil
                            """
                            )
                            connection.execute(insert_usuarios_web, {"usrcodigo": encriptar(txtUsrCodigo.strip()), "usuisys": sUsuario, "estisys": sNomEst, "usrcodigo_perfil": encriptar(dcbPerfilBoundedText.strip())})

        return jsonify({"data": "Usuario creado exitosamente" if sOpcion == "NEW" else "Usuario actualizado exitosamente"}), 200
    except Exception as error:
        return jsonify({"error": {"msg": str(error)}}), 500
