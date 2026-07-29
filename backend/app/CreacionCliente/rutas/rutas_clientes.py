import traceback
from datetime import datetime
from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from app.extensions import db
from app.CreacionCliente import bp
import base64
from decimal import Decimal
from services.encrip_desencrip import desencriptar


# =================================================================
# 1. OBTENER CATÁLOGOS (COMBOS) PARA EL FORMULARIO
# Equivalente a la rutina RstDesconectado() de VB6
# =================================================================
@bp.route("/getCatalogosCliente", methods=["POST"])
@jwt_required()
def get_catalogos_cliente():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        db.session = get_session(bd_cliente)
        catalogos = {}

        with db.session.bind.connect() as conn:
            # Regiones
            catalogos["regiones"] = [dict(r) for r in conn.execute(text("SELECT regcodigo AS id, regdescri AS label FROM cxcbreg WHERE ciacodigo = :cia AND regstatus = 'A' ORDER BY regdescri"), {"cia": ciacodigo}).mappings().fetchall()]

            # Zonas
            catalogos["zonas"] = [dict(r) for r in conn.execute(text("SELECT zoncodigo AS id, zondescri AS label FROM fapzona WHERE ciacodigo = :cia AND zonstatus = 'A' ORDER BY zondescri"), {"cia": ciacodigo}).mappings().fetchall()]

            # Provincias
            catalogos["provincias"] = [dict(r) for r in conn.execute(text("SELECT procodigo AS id, prodescri AS label FROM rhbprov WHERE prostatus = 'A' ORDER BY prodescri")).mappings().fetchall()]

            # Ciudades (Incluye DINARDAP)
            catalogos["ciudades"] = [dict(r) for r in conn.execute(text("SELECT ciucodigo AS id, ciudescri + ' DINARDAP ' + ISNULL(ciudinardap, '') AS label FROM hotbciu WHERE ciustatus = 'A' ORDER BY ciudescri")).mappings().fetchall()]

            # Parroquias
            catalogos["parroquias"] = [dict(r) for r in conn.execute(text("SELECT parrocodigo AS id, parrodescri AS label FROM cxcbparroquia WHERE parrostatus = 'A' ORDER BY parrodescri")).mappings().fetchall()]

            # Tipos de Cliente
            catalogos["tiposCliente"] = [dict(r) for r in conn.execute(text("SELECT tipcodigo AS id, tipdescri AS label FROM cxcbtipcli WHERE ciacodigo = :cia AND tipstatus = 'A' ORDER BY tipdescri"), {"cia": ciacodigo}).mappings().fetchall()]

            # Oficiales de Crédito (Desencriptando usrcodigo y usrnombre como en VB6)
            oficiales = []
            for r in conn.execute(text("SELECT usrcodigo, usrnombre FROM siaccusr WHERE usrflagoficre <> 0 and usrstatus = 'D'")).mappings().fetchall():
                try:
                    dec_nom = desencriptar(r["usrnombre"])
                except Exception:
                    dec_nom = r["usrnombre"]

                # El "value" DEBE ser el r["usrcodigo"] original (encriptado)
                # El "label" es el nombre desencriptado que verá el usuario
                oficiales.append({"value": r["usrcodigo"], "label": dec_nom})

            catalogos["oficialesCredito"] = sorted(oficiales, key=lambda x: x["label"])

            # Calificaciones
            catalogos["calificaciones"] = [dict(r) for r in conn.execute(text("SELECT calfcodigo AS id, calfcodigo AS label FROM cxctcalificacion WHERE ciacodigo = :cia AND calfstatus = 'A'"), {"cia": ciacodigo}).mappings().fetchall()]

            # Actividades Económicas y Sectores
            catalogos["actividades"] = [dict(r) for r in conn.execute(text("SELECT activicodigo AS id, actividescri AS label FROM cxcbacteconomicas WHERE activistatus = 'A'")).mappings().fetchall()]

            catalogos["sectores"] = [dict(r) for r in conn.execute(text("SELECT sectorcodigo AS id, sectordescri AS label FROM cxcbsectorpublico WHERE sectorstatus = 'A'")).mappings().fetchall()]

            # Áreas de Trabajo
            catalogos["areasTrabajo"] = [dict(r) for r in conn.execute(text("SELECT areadescri AS id, areadescri AS label FROM cxcbareas ORDER BY areadescri")).mappings().fetchall()]

            # Vendedores
            catalogos["vendedores"] = [dict(r) for r in conn.execute(text("SELECT vencodigo AS value, vencodigo + ' - ' + vennombre AS label FROM fapvendedor WHERE ciacodigo = :cia AND venstatus = 'A' ORDER BY vennombre"), {"cia": ciacodigo}).mappings().fetchall()]

            # Localidades
            catalogos["localidades"] = [dict(r) for r in conn.execute(text("SELECT loccodigo AS value, loccodigo + ' - ' + locdescri AS label FROM cgblocal WHERE ciacodigo = :cia AND locstatus = 'A' ORDER BY locdescri"), {"cia": ciacodigo}).mappings().fetchall()]

            # Líneas
            catalogos["lineas"] = [dict(r) for r in conn.execute(text("SELECT lincodigo AS value, lincodigo + ' - ' + lindescri AS label FROM inblin WHERE ciacodigo = :cia AND linstatus = 'A' ORDER BY lindescri"), {"cia": ciacodigo}).mappings().fetchall()]

            # Marcas
            catalogos["marcas"] = [dict(r) for r in conn.execute(text("SELECT marcodigo AS value, marcodigo + ' - ' + mardescri AS label FROM inbmar WHERE ciacodigo = :cia AND marstatus = 'A' ORDER BY mardescri"), {"cia": ciacodigo}).mappings().fetchall()]

            # Artículos
            catalogos["articulos"] = [dict(r) for r in conn.execute(text("SELECT artcodigo AS value, artcodigo + ' - ' + artdescri AS label FROM inmart WHERE ciacodigo = :cia AND artstatus = 'A' ORDER BY artdescri"), {"cia": ciacodigo}).mappings().fetchall()]

            # Bancos
            catalogos["bancos"] = [dict(r) for r in conn.execute(text("SELECT bcocodigo AS value, bcocodigo + ' - ' + bcodescri AS label FROM cxcbbco WHERE ciacodigo = :cia AND bcostatus = 'A' ORDER BY bcodescri"), {"cia": ciacodigo}).mappings().fetchall()]

        return jsonify({"success": True, "data": catalogos}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 2. PERMISOS DINÁMICOS Y CONFIGURACIÓN DE COMPAÑÍA
# =================================================================
@bp.route("/getPermisosCliente", methods=["POST"])
@jwt_required()
def get_permisos_cliente():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["seleccion"].get("loccodigo", "01")
        usuario_id = claims["user"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        from services.encrip_desencrip import encriptar

        usr_encriptado = encriptar(usuario_id)

        db.session = get_session(bd_cliente)
        permisos = {}

        with db.session.bind.connect() as conn:
            # 1. Permisos del usuario en la localidad
            query = text(
                """
                SELECT usrflagmodcredito, usrflagemicobrel, usrflagclicomenta,
                       usrflagclicreahis, usrflagclielihis
                FROM siactloc
                WHERE usrcodigo = :usr AND ciacodigo = :cia AND loccodigo = :loc
            """
            )
            res = conn.execute(query, {"usr": usr_encriptado, "cia": ciacodigo, "loc": loccodigo}).mappings().first()

            # 2. Configuración de Secuencia de la Compañía
            q_cia = text("SELECT codclisec FROM siaccia WHERE ciacodigo = :cia")
            res_cia = conn.execute(q_cia, {"cia": ciacodigo}).mappings().first()
            auto_codigo = bool(res_cia["codclisec"]) if res_cia and res_cia["codclisec"] else False

            if res:
                permisos = {
                    "modificarCredito": bool(res["usrflagmodcredito"]),
                    "modificarDescuentosYVendedores": bool(res["usrflagemicobrel"]),
                    "modificarComentarios": bool(res["usrflagclicomenta"]),
                    "crearHistorial": bool(res["usrflagclicreahis"]),
                    "eliminarHistorial": bool(res["usrflagclielihis"]),
                    "autoCodigoCliente": auto_codigo,
                }
            else:
                permisos = {"modificarCredito": False, "modificarDescuentosYVendedores": False, "modificarComentarios": False, "crearHistorial": False, "eliminarHistorial": False, "autoCodigoCliente": auto_codigo}

        return jsonify({"success": True, "data": permisos}), 200

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 3. GUARDAR / EDITAR CLIENTE Y TODAS SUS TABLAS HIJAS
# =================================================================
@bp.route("/guardarCliente", methods=["POST"])
@jwt_required()
def guardar_cliente():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usuario_id = claims["user"]
        bd_cliente = claims["seleccion"]["clicianonBD"]
        estacion = request.headers.get("X-Forwarded-For", request.remote_addr)[:15]

        payload = request.get_json() or {}
        modo = payload.get("modo", "NEW")
        maestro = payload.get("maestro", {})
        hijos = payload.get("hijos", {})

        clicodigo = maestro.get("clicodigo", "").strip()
        cliruc = maestro.get("cliruc", "")
        clinombre = maestro.get("clinombre", "")

        if not clinombre:
            return jsonify({"success": False, "message": "Nombre de cliente es obligatorio."}), 200

        dias_cr = float(maestro.get("clidiascrs", 0))
        monto_cr = float(maestro.get("climontocrs", 0))
        if (dias_cr > 0 or monto_cr > 0) and not maestro.get("clirucrepres"):
            return jsonify({"success": False, "message": "Cliente con crédito necesita Representante Legal."}), 200

        now = datetime.now()
        fecha_sys = now.strftime("%Y-%m-%d")
        hora_sys = now.strftime("%H:%M:%S")

        db.session = get_session(bd_cliente)
        with db.session.bind.connect() as conn:
            with conn.begin():
                # --- GENERACIÓN DE SECUENCIA AUTOMÁTICA ---
                if modo == "NEW":
                    q_cia = text("SELECT codclisec FROM siaccia WHERE ciacodigo = :cia")
                    auto_codigo = conn.execute(q_cia, {"cia": ciacodigo}).scalar()

                    if auto_codigo:
                        # Extraer y actualizar de la tabla de secuencias
                        q_sec = text(
                            """
                            UPDATE siacsec SET secnumero = secnumero + 1
                            OUTPUT inserted.secnumero
                            WHERE ciacodigo = :cia AND seccodigo = 'CLI'
                        """
                        )
                        nuevo_seq = conn.execute(q_sec, {"cia": ciacodigo}).scalar()
                        # Si no existía el registro 'CLI', lo creamos
                        if not nuevo_seq:
                            conn.execute(text("INSERT INTO siacsec (ciacodigo, seccodigo, secnumero) VALUES (:cia, 'CLI', 1)"), {"cia": ciacodigo})
                            nuevo_seq = 1
                        # Lo rellena con ceros a 6 dígitos
                        clicodigo = str(nuevo_seq).zfill(6)
                    else:
                        if not clicodigo:
                            return jsonify({"success": False, "message": "Debe digitar un Código de Cliente."}), 200
                # ------------------------------------------

                q_dup = text("SELECT clinombre FROM cxcmcli WHERE ciacodigo = :cia AND cliruc = :ruc AND clicodigo != :cli")
                dup = conn.execute(q_dup, {"cia": ciacodigo, "ruc": cliruc, "cli": clicodigo}).mappings().first()
                if dup:
                    return jsonify({"success": False, "message": f"Número de Identificación ya asignado a: {dup['clinombre']}"}), 200

                if modo == "EDIT":
                    fecha_ui = maestro.get("clifecmsys")
                    hora_ui = maestro.get("clihormsys")

                    if fecha_ui and hora_ui:
                        q_check = text("SELECT clifecmsys, clihormsys FROM cxcmcli WHERE ciacodigo = :cia AND clicodigo = :cli")
                        current_db = conn.execute(q_check, {"cia": ciacodigo, "cli": clicodigo}).mappings().first()

                        if not current_db:
                            return jsonify({"success": False, "message": "Cliente NO existe para validar cambios."}), 200

                        # Formato de la Base de Datos
                        db_fecha = current_db["clifecmsys"].strftime("%Y-%m-%d") if current_db["clifecmsys"] else ""
                        db_hora = current_db["clihormsys"].strftime("%H:%M:%S") if current_db["clihormsys"] else ""

                        # Limpieza de la carga útil del Frontend (separar por espacio y tomar lo que sirve)
                        fecha_ui_clean = fecha_ui.split(" ")[0] if " " in fecha_ui else fecha_ui
                        hora_ui_clean = hora_ui.split(" ")[1] if " " in hora_ui else hora_ui

                        if fecha_ui_clean != db_fecha or hora_ui_clean != db_hora:
                            return jsonify({"success": False, "message": "Cliente fue modificado por otro usuario posterior a su Consulta."}), 200

                    # Si pasa la validación, bloqueamos el registro a nombre de este usuario
                    conn.execute(text("UPDATE cxcmcli SET cliusumsys = :usr WHERE ciacodigo = :cia AND clicodigo = :cli"), {"usr": usuario_id, "cia": ciacodigo, "cli": clicodigo})

                # --- 3. GUARDAR MAESTRO (Con clinommatriz) ---
                if modo == "NEW":
                    q_maestro = text(
                        """
                        INSERT INTO cxcmcli (
                            ciacodigo, clicodigo, clifecisys, clihorisys, cliusuisys, cliestisys,
                            clinombre, cliaparta, cliruc, clidirec, clidirec2, clirepres,
                            clitelef1, clitelef2, clifax, zoncodigo, regcodigo, tipcodigo,
                            clidiascrs, climontocrs, cliprefac, clistatus, cliemail, website,
                            procodigo, ciucodigo, usrcodigo, clirucrepres, cliidentifica,
                            cliidenrep, cliidencon, cliobserva, clifecnac, activicodigo, sectorcodigo,
                            clifecmsys, clihormsys, cliusumsys, cliestmsys,
                            clisexo, cliestciv, clipersona, cliprofesion, cliintersec, cliorigening, calfcodigo,
                            cliruccon, clinombrecon, clidireccon, cliprofesioncon,
                            cliapliiva, clibloqueo, clitipodomicilio, clitiempodomicilio, cliubicacionrapido,
                            tarenviosta, cliparterel, cliconespecial,
                            clireferencia1, cliparentesco1, clireftelefono1,
                            clireferencia2, cliparentesco2, clireftelefono2,
                            clisalaplis, clidiascrd, climontocrd, clisalaplid,
                            clirucmatriz, clinommatriz,parrocodigo
                        ) VALUES (
                            :cia, :cli, :fecisys, :horisys, :usu, :est,
                            :nom, :apa, :ruc, :dir1, :dir2, :rep,
                            :t1, :t2, :fax, :zon, :reg, :tip,
                            :dcrs, :mcrs, :pfac, :sta, :ema, :web,
                            :pro, :ciu, :usr_ofi, :rucrep, :iden,
                            :idenrep, :idencon, :obs, :fecnac, :act, :sec,
                            :fecisys, :horisys, :usu, :est,
                            :sexo, :estciv, :persona, :profesion, :celular, :origening, :calfc,
                            :ruccon, :nomcon, :dircon, :profcon,
                            :iva, :bloqueo, :tipodom, :tiempodom, :refrap,
                            :tarenvio, :parterel, :conesp,
                            :ref1, :par1, :tel1,
                            :ref2, :par2, :tel2,
                            0, 0, 0, 0,
                            :rucmatriz, :nommatriz, :parro
                        )
                    """
                    )
                else:
                    q_maestro = text(
                        """
                        UPDATE cxcmcli SET
                            clinombre = :nom, cliaparta = :apa, cliruc = :ruc, clidirec = :dir1,
                            clidirec2 = :dir2, clirepres = :rep, clitelef1 = :t1, clitelef2 = :t2,
                            clifax = :fax, zoncodigo = :zon, regcodigo = :reg, tipcodigo = :tip,
                            clidiascrs = :dcrs, climontocrs = :mcrs, cliprefac = :pfac,
                            clistatus = :sta, cliemail = :ema, website = :web, procodigo = :pro,
                            ciucodigo = :ciu, usrcodigo = :usr_ofi, clirucrepres = :rucrep,
                            cliidentifica = :iden, cliidenrep = :idenrep, cliidencon = :idencon,
                            cliobserva = :obs, clifecnac = :fecnac, activicodigo = :act,
                            sectorcodigo = :sec, clifecmsys = :fecisys, clihormsys = :horisys, cliusumsys = :usu, cliestmsys = :est,
                            clisexo = :sexo, cliestciv = :estciv, clipersona = :persona, cliprofesion = :profesion,
                            cliintersec = :celular, cliorigening = :origening, calfcodigo = :calfc,
                            cliruccon = :ruccon, clinombrecon = :nomcon, clidireccon = :dircon, cliprofesioncon = :profcon,
                            cliapliiva = :iva, clibloqueo = :bloqueo, clitipodomicilio = :tipodom, clitiempodomicilio = :tiempodom,
                            cliubicacionrapido = :refrap, tarenviosta = :tarenvio, cliparterel = :parterel, cliconespecial = :conesp,
                            clireferencia1 = :ref1, cliparentesco1 = :par1, clireftelefono1 = :tel1,
                            clireferencia2 = :ref2, cliparentesco2 = :par2, clireftelefono2 = :tel2,
                            clirucmatriz = :rucmatriz, clinommatriz = :nommatriz, parrocodigo = :parro
                        WHERE ciacodigo = :cia AND clicodigo = :cli
                    """
                    )

                params_maestro = {
                    "cia": ciacodigo,
                    "cli": clicodigo,
                    "fecisys": fecha_sys,
                    "horisys": hora_sys,
                    "usu": usuario_id,
                    "est": estacion,
                    "nom": clinombre,
                    "apa": maestro.get("cliaparta", ""),
                    "ruc": cliruc,
                    "dir1": maestro.get("clidirec", ""),
                    "dir2": maestro.get("clidirec2", ""),
                    "rep": maestro.get("clirepres", ""),
                    "t1": maestro.get("clitelef1", ""),
                    "t2": maestro.get("clitelef2", ""),
                    "fax": maestro.get("clifax", ""),
                    "zon": maestro.get("zoncodigo") or None,
                    "reg": maestro.get("regcodigo") or None,
                    "tip": maestro.get("tipcodigo") or None,
                    "dcrs": dias_cr,
                    "mcrs": monto_cr,
                    "pfac": maestro.get("cliprefac", 1),
                    "sta": maestro.get("clistatus", "A"),
                    "ema": maestro.get("cliemail", ""),
                    "web": maestro.get("website", ""),
                    "pro": maestro.get("procodigo") or None,
                    "ciu": maestro.get("ciucodigo") or None,
                    "usr_ofi": maestro.get("usrcodigo") or None,
                    "rucrep": maestro.get("clirucrepres", ""),
                    "iden": maestro.get("cliidentifica", "C"),
                    "idenrep": maestro.get("cliidenrep", "O"),
                    "idencon": maestro.get("cliidencon", "O"),
                    "obs": maestro.get("cliobserva", ""),
                    "fecnac": maestro.get("clifecnac") or None,
                    "act": maestro.get("activicodigo") or None,
                    "sec": maestro.get("sectorcodigo") or None,
                    "sexo": maestro.get("clisexo", ""),
                    "estciv": maestro.get("cliestciv", ""),
                    "persona": maestro.get("clipersona", ""),
                    "profesion": maestro.get("cliprofesion", ""),
                    "celular": maestro.get("cliintersec", ""),
                    "origening": maestro.get("cliorigening", "I"),
                    "calfc": maestro.get("calfcodigo", ""),
                    "ruccon": maestro.get("cliruccon", ""),
                    "nomcon": maestro.get("clinombrecon", ""),
                    "dircon": maestro.get("clidireccon", ""),
                    "profcon": maestro.get("cliprofesioncon", ""),
                    "iva": maestro.get("cliapliiva", -1),
                    "bloqueo": maestro.get("clibloqueo", 0),
                    "tipodom": maestro.get("clitipodomicilio", ""),
                    "tiempodom": maestro.get("clitiempodomicilio", ""),
                    "refrap": maestro.get("cliubicacionrapido", ""),
                    "tarenvio": maestro.get("tarenviosta", "D"),
                    "parterel": maestro.get("cliparterel", 0),
                    "conesp": maestro.get("cliconespecial", 0),
                    "ref1": maestro.get("clireferencia1", ""),
                    "par1": maestro.get("cliparentesco1", ""),
                    "tel1": maestro.get("clireftelefono1", ""),
                    "ref2": maestro.get("clireferencia2", ""),
                    "par2": maestro.get("cliparentesco2", ""),
                    "tel2": maestro.get("clireftelefono2", ""),
                    "parro": maestro.get("parrocodigo") or None,
                    # Corrección del NOT NULL asignando el mismo dato del cliente (Lógica VB6)
                    "rucmatriz": maestro.get("clirucmatriz") or cliruc,
                    "nommatriz": maestro.get("clinommatriz") or clinombre,
                }
                conn.execute(q_maestro, params_maestro)

                # 4. Auditoría (Espejo a cxchmcli usando la lógica VB6)
                accion_auditoria = "INSERT" if modo == "NEW" else "UPDATE"

                q_audit = text(
                    """
                    INSERT INTO cxchmcli (
                        cliaccion, ciacodigo, clicodigo, clifecisys, clihorisys, cliusuisys, clinombre,
                        cliaparta, cliruc, clidirec, clidirec2, clirepres, clitelef1, clitelef2, clifax,
                        zoncodigo, regcodigo, tipcodigo, clidiascrs, climontocrs, clisalaplis, clidiascrd, climontocrd,
                        clisalaplid, cliprefac, clistatus, clifecmsys, clihormsys, cliusumsys, website, procodigo, cliobserva, cliemail,
                        cliapliiva, clibloqueo, clifecnac, cliestciv, cliprofesion, ciucodigo, usrcodigo, cliruccon, clinombrecon, clidireccon,
                        cliprofesioncon, cliintersec, clinumestable, clirucmatriz, clinommatriz, tarenviosta, clirucrepres, cliidentifica,
                        cliidenrep, cliidencon, calificacion, calfcodigo, activicodigo, sectorcodigo, clidiapago, clihorapagodesde,
                        clihorapagohasta, clidiasrecibefac1, clidiaentregafac, cliestisys, cliestmsys, cliconespecial, clitelpref1,
                        clitelpref2, clitelext1, clitelext2, clisexo, clipersona, cliorigening, parrocodigo, cliparterel,
                        clitipodomicilio, clitiempodomicilio, cliubicacionrapido, clireferencia1, cliparentesco1, clireftelefono1, clireferencia2, cliparentesco2, clireftelefono2
                    )
                    SELECT
                        :accion AS cliaccion, ciacodigo, clicodigo, clifecisys, clihorisys, cliusuisys, clinombre,
                        cliaparta, cliruc, clidirec, clidirec2, clirepres, clitelef1, clitelef2, clifax,
                        zoncodigo, regcodigo, tipcodigo, clidiascrs, climontocrs, clisalaplis, clidiascrd, climontocrd,
                        clisalaplid, cliprefac, clistatus, clifecmsys, clihormsys, cliusumsys, website, procodigo, cliobserva, cliemail,
                        cliapliiva, clibloqueo, clifecnac, cliestciv, cliprofesion, ciucodigo, usrcodigo, cliruccon, clinombrecon, clidireccon,
                        cliprofesioncon, cliintersec, clinumestable, clirucmatriz, clinommatriz, tarenviosta, clirucrepres, cliidentifica,
                        cliidenrep, cliidencon, calificacion, calfcodigo, activicodigo, sectorcodigo, clidiapago, clihorapagodesde,
                        clihorapagohasta, clidiasrecibefac1, clidiaentregafac, cliestisys, cliestmsys, cliconespecial, clitelpref1,
                        clitelpref2, clitelext1, clitelext2, clisexo, clipersona, cliorigening, parrocodigo, cliparterel,
                        clitipodomicilio, clitiempodomicilio, cliubicacionrapido, clireferencia1, cliparentesco1, clireftelefono1, clireferencia2, cliparentesco2, clireftelefono2
                    FROM cxcmcli
                    WHERE ciacodigo = :cia AND clicodigo = :cli
                """
                )
                conn.execute(q_audit, {"accion": accion_auditoria, "cia": ciacodigo, "cli": clicodigo})

                # =======================================================
                # PROCESAR TABLAS HIJAS (LÓGICA DATAGRID: DELETE & INSERT)
                # =======================================================
                base_params = {"cia": ciacodigo, "cli": clicodigo}

                # A. AGENCIAS
                agencias = hijos.get("agencias", [])
                conn.execute(text("DELETE FROM cxctcliagencias WHERE ciacodigo = :cia AND clicodigo = :cli"), base_params)
                for ag in agencias:
                    conn.execute(
                        text(
                            """
                        INSERT INTO cxctcliagencias (
                            ciacodigo, clicodigo, agencodigo, agendescri, agendirec,
                            agentelef1, agentelef2, agenemail, regcodigo, zoncodigo, procodigo, ciucodigo,
                            agenfecisys, agenhorisys, agenusuisys, agenestisys,
                            agentelpref1, agentelpref2, agentelext1, agentelext2, agecodrelext
                        ) VALUES (
                            :cia, :cli, :agc, :desc, :dir, :tel1, :tel2, :ema, :reg, :zon, :pro, :ciu,
                            :fec, :hor, :usu, :est, :pref1, :pref2, :ext1, :ext2, ''
                        )
                    """
                        ),
                        {
                            "cia": ciacodigo,
                            "cli": clicodigo,
                            "agc": ag["agencodigo"],
                            "desc": ag.get("agendescri") or "",
                            "dir": ag.get("agendirec") or "",
                            "tel1": ag.get("agentelef1") or "",
                            "tel2": ag.get("agentelef2") or "",
                            "ema": ag.get("agenemail") or "",
                            "reg": ag.get("regcodigo") or "",
                            "zon": ag.get("zoncodigo") or "",
                            "pro": ag.get("procodigo") or "",
                            "ciu": ag.get("ciucodigo") or "",
                            "fec": fecha_sys,
                            "hor": hora_sys,
                            "usu": usuario_id,
                            "est": estacion,
                            "pref1": ag.get("agentelpref1") or "",
                            "pref2": ag.get("agentelpref2") or "",
                            "ext1": ag.get("agentelext1") or "",
                            "ext2": ag.get("agentelext2") or "",
                        },
                    )

                # B. CONTACTOS
                contactos = hijos.get("contactos", [])
                conn.execute(text("DELETE FROM cxctclicontactos WHERE ciacodigo = :cia AND clicodigo = :cli"), base_params)
                for ct in contactos:
                    conn.execute(
                        text(
                            """
                        INSERT INTO cxctclicontactos (
                            ciacodigo, clicodigo, agencodigo, condescri, concargo, contelef1, contelef2,
                            concelular, conemail, concomenta, areadescri,
                            confecisys, conhorisys, conusuisys, conestisys,
                            contelpref1, contelpref2, contelext1, contelext2, concodrelext, convalviaje
                        ) VALUES (
                            :cia, :cli, :agc, :nom, :car, :tel1, :tel2, :cel, :ema, :com, :are,
                            :fec, :hor, :usu, :est, :pref1, :pref2, :ext1, :ext2, '', 0
                        )
                    """
                        ),
                        {
                            "cia": ciacodigo,
                            "cli": clicodigo,
                            "agc": ct["agencodigo"],
                            "nom": ct["condescri"],
                            "car": ct.get("concargo") or "",
                            "tel1": ct.get("contelef1") or "",
                            "tel2": ct.get("contelef2") or "",
                            "cel": ct.get("concelular") or "",
                            "ema": ct.get("conemail") or "",
                            "com": ct.get("concomenta") or "",
                            "are": ct.get("areadescri") or "",
                            "fec": fecha_sys,
                            "hor": hora_sys,
                            "usu": usuario_id,
                            "est": estacion,
                            "pref1": ct.get("contelpref1") or "",
                            "pref2": ct.get("contelpref2") or "",
                            "ext1": ct.get("contelext1") or "",
                            "ext2": ct.get("contelext2") or "",
                        },
                    )

                # C. REFERENCIAS BANCARIAS
                referencias = hijos.get("referencias", [])
                conn.execute(text("DELETE FROM cxctclireferencias WHERE ciacodigo = :cia AND clicodigo = :cli"), base_params)
                for ref in referencias:
                    conn.execute(
                        text(
                            """
                        INSERT INTO cxctclireferencias (
                            ciacodigo, clicodigo, bcotipo, bcocodigo, bconumcta, bcofecape, boccalifi,
                            bcofemsys, bcohormsys, bcousumsys, bcoestmsys
                        ) VALUES (
                            :cia, :cli, :tip, :cod, :cta, :fecape, :cal,
                            :fec, :hor, :usu, :est
                        )
                    """
                        ),
                        {
                            "cia": ciacodigo,
                            "cli": clicodigo,
                            "tip": ref.get("bcotipo") or "",
                            "cod": ref["bcocodigo"],
                            "cta": ref.get("bconumcta") or "",
                            "cal": ref.get("boccalifi") or "",
                            "fecape": ref.get("bcofecape") or fecha_sys,
                            "fec": fecha_sys,
                            "hor": hora_sys,
                            "usu": usuario_id,
                            "est": estacion,
                        },
                    )

                # D. VENDEDORES
                vendedores = hijos.get("vendedores", [])
                conn.execute(text("DELETE FROM cxctcliven WHERE ciacodigo = :cia AND clicodigo = :cli"), base_params)
                for ven in vendedores:
                    conn.execute(
                        text(
                            """
                        INSERT INTO cxctcliven (
                            ciacodigo, clicodigo, vencodigo, loccodigo,
                            venfecisys, venhorisys, venusuisys, venestisys
                        ) VALUES (
                            :cia, :cli, :ven, :loc, :fec, :hor, :usu, :est
                        )
                    """
                        ),
                        {"cia": ciacodigo, "cli": clicodigo, "ven": ven["vencodigo"], "loc": ven["loccodigo"], "fec": fecha_sys, "hor": hora_sys, "usu": usuario_id, "est": estacion},
                    )

                # E. DESCUENTOS POR LÍNEA/MARCA
                desc_linea = hijos.get("descuentosLinea", [])
                conn.execute(text("DELETE FROM cxcbclidesc WHERE ciacodigo = :cia AND clicodigo = :cli"), base_params)
                for dl in desc_linea:
                    conn.execute(
                        text(
                            """
                        INSERT INTO cxcbclidesc (
                            ciacodigo, clicodigo, lincodigo, marcodigo, desporcentaje, deslistaprecio,
                            desfecisys, deshorisys, desusuisys, desestisys,
                            desfecmsys, deshormsys, desusumsys, desestmsys
                        ) VALUES (
                            :cia, :cli, :lin, :mar, :porc, :lista,
                            :fec, :hor, :usu, :est, :fec, :hor, :usu, :est
                        )
                    """
                        ),
                        {"cia": ciacodigo, "cli": clicodigo, "lin": dl["lincodigo"], "mar": dl.get("marcodigo", ""), "porc": float(dl.get("desporcentaje", 0)), "lista": int(dl.get("deslistaprecio", 1)), "fec": fecha_sys, "hor": hora_sys, "usu": usuario_id, "est": estacion},
                    )

                    conn.execute(
                        text(
                            """
                        INSERT INTO cxchbclidesc (
                            ciacodigo, lincodigo, marcodigo, clicodigo, desporcentaje, deslistaprecio,
                            desfecisys, deshorisys, desusuisys, desestisys, desfecmsys, deshormsys, desusumsys, desestmsys, desaccion
                        ) VALUES (
                            :cia, :lin, :mar, :cli, :porc, :lista, :fec, :hor, :usu, :est, :fec, :hor, :usu, :est, :accion
                        )
                    """
                        ),
                        {
                            "cia": ciacodigo,
                            "cli": clicodigo,
                            "lin": dl["lincodigo"],
                            "mar": dl.get("marcodigo", ""),
                            "porc": float(dl.get("desporcentaje", 0)),
                            "lista": int(dl.get("deslistaprecio", 1)),
                            "fec": fecha_sys,
                            "hor": hora_sys,
                            "usu": usuario_id,
                            "est": estacion,
                            "accion": accion_auditoria,
                        },
                    )

                # F. DESCUENTOS POR ARTÍCULO
                desc_art = hijos.get("descuentosArticulo", [])
                conn.execute(text("DELETE FROM cxcbclidescart WHERE ciacodigo = :cia AND clicodigo = :cli"), base_params)
                for da in desc_art:
                    conn.execute(
                        text(
                            """
                        INSERT INTO cxcbclidescart (
                            ciacodigo, clicodigo, invcodigo, artcodigo, desporcentaje, deslistaprecio,
                            desfecisys, deshorisys, desusuisys, desestisys,
                            desfecmsys, deshormsys, desusumsys, desestmsys
                        ) VALUES (
                            :cia, :cli, '01', :art, :porc, :lista,
                            :fec, :hor, :usu, :est, :fec, :hor, :usu, :est
                        )
                    """
                        ),
                        {"cia": ciacodigo, "cli": clicodigo, "art": da["artcodigo"], "porc": float(da.get("desporcentaje", 0)), "lista": int(da.get("deslistaprecio", 1)), "fec": fecha_sys, "hor": hora_sys, "usu": usuario_id, "est": estacion},
                    )

                    conn.execute(
                        text(
                            """
                        INSERT INTO cxchbclidescart (
                            ciacodigo, invcodigo, artcodigo, clicodigo, desporcentaje, deslistaprecio,
                            desfecisys, deshorisys, desusuisys, desestisys, desfecmsys, deshormsys, desusumsys, desestmsys, desaccion
                        ) VALUES (
                            :cia, '01', :art, :cli, :porc, :lista, :fec, :hor, :usu, :est, :fec, :hor, :usu, :est, :accion
                        )
                    """
                        ),
                        {"cia": ciacodigo, "cli": clicodigo, "art": da["artcodigo"], "porc": float(da.get("desporcentaje", 0)), "lista": int(da.get("deslistaprecio", 1)), "fec": fecha_sys, "hor": hora_sys, "usu": usuario_id, "est": estacion, "accion": accion_auditoria},
                    )

                # G. HISTORIAL DE OBSERVACIONES (Solo inserta los nuevos)
                historial_nuevos = hijos.get("historialNuevos", [])
                for h in historial_nuevos:
                    conn.execute(
                        text(
                            """
                        INSERT INTO cxctclihistorial (
                            ciacodigo, clicodigo, obssecuen, obsobserva,
                            obsfecisys, obshorisys, obsusuisys, obsestisys
                        ) VALUES (
                            :cia, :cli, (SELECT ISNULL(MAX(obssecuen), 0) + 1 FROM cxctclihistorial WHERE ciacodigo = :cia AND clicodigo = :cli),
                            :obs, :fec, :hor, :usu, :est
                        )
                    """
                        ),
                        {"cia": ciacodigo, "cli": clicodigo, "obs": h["obsobserva"], "fec": fecha_sys, "hor": hora_sys, "usu": usuario_id, "est": estacion},
                    )

        return jsonify({"success": True, "message": "Cliente guardado exitosamente."}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Error guardando cliente: {str(e)}"}), 500


# =================================================================
# 4. OBTENER CLIENTE COMPLETO (MAESTRO Y DETALLES)
# Equivalente a la función cargareg() en VB6
# =================================================================
@bp.route("/getClienteCompleto", methods=["POST"])
@jwt_required()
def get_cliente_completo():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        payload = request.get_json() or {}
        clicodigo = payload.get("clicodigo")

        if not clicodigo:
            return jsonify({"success": False, "message": "Código de cliente es requerido"}), 400

        db.session = get_session(bd_cliente)
        data_completa = {}
        base_params = {"cia": ciacodigo, "cli": clicodigo}

        with db.session.bind.connect() as conn:
            # 1. Maestro (cxcmcli)
            q_maestro = text("SELECT * FROM cxcmcli WHERE ciacodigo = :cia AND clicodigo = :cli")
            maestro_row = conn.execute(q_maestro, base_params).mappings().first()

            if not maestro_row:
                return jsonify({"success": False, "message": "No se encontró el cliente"}), 404

            # Convertimos las fechas/decimales para que jsonify no falle
            maestro_dict = dict(maestro_row)
            for k, v in maestro_dict.items():
                if hasattr(v, "strftime"):
                    maestro_dict[k] = v.strftime("%Y-%m-%d %H:%M:%S")
                    # Asuma from decimal import Decimal al inicio
                elif isinstance(v, Decimal):
                    maestro_dict[k] = float(v)

            data_completa["maestro"] = maestro_dict

            # 2. Agencias
            q_agencias = text("SELECT * FROM cxctcliagencias WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY agencodigo")
            data_completa["agencias"] = [dict(r) for r in conn.execute(q_agencias, base_params).mappings().fetchall()]

            # 3. Contactos
            q_contactos = text("SELECT * FROM cxctclicontactos WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY agencodigo, condescri")
            data_completa["contactos"] = [dict(r) for r in conn.execute(q_contactos, base_params).mappings().fetchall()]

            # 4. Referencias Bancarias
            q_referencias = text("SELECT * FROM cxctclireferencias WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY bcotipo, bcocodigo")
            data_completa["referencias"] = [dict(r) for r in conn.execute(q_referencias, base_params).mappings().fetchall()]

            # 5. Descuentos por Línea
            q_desc_linea = text("SELECT * FROM cxcbclidesc WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY lincodigo")
            data_completa["descuentosLinea"] = [dict(r) for r in conn.execute(q_desc_linea, base_params).mappings().fetchall()]

            # 6. Descuentos por Artículo
            q_desc_art = text("SELECT * FROM cxcbclidescart WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY artcodigo")
            data_completa["descuentosArticulo"] = [dict(r) for r in conn.execute(q_desc_art, base_params).mappings().fetchall()]

            # 7. Vendedores
            q_vendedores = text("SELECT * FROM cxctcliven WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY vencodigo")
            data_completa["vendedores"] = [dict(r) for r in conn.execute(q_vendedores, base_params).mappings().fetchall()]

            # 8. Historial de Observaciones
            q_historial = text(
                """
                SELECT obssecuen, obsobserva, obsestisys, obsfecisys, obshorisys, obsusuisys
                FROM cxctclihistorial
                WHERE ciacodigo = :cia AND clicodigo = :cli
                ORDER BY obsfecisys DESC, obshorisys DESC
            """
            )
            historial = []
            for r in conn.execute(q_historial, base_params).mappings().fetchall():
                h = dict(r)
                if h["obsfecisys"]:
                    h["obsfecisys"] = h["obsfecisys"].strftime("%Y-%m-%d")
                if h["obshorisys"]:
                    h["obshorisys"] = h["obshorisys"].strftime("%H:%M:%S")
                historial.append(h)
            data_completa["historial"] = historial

            # 9. Auditoría del Cliente (cxchmcli) - ACTUALIZADO CON TODAS LAS COLUMNAS VB6
            q_aud_cli = text(
                """
                SELECT
                    cliaccion, cliusumsys, clifecmsys, clihormsys, clicodigo, clinombre,
                    cliidentifica, cliruc, clidiascrs, climontocrs, cliprefac, clibloqueo,
                    calificacion, cliapliiva, clidiasrecibefac1, clidiaentregafac, cliemail,
                    cliintersec, clitelef1, clitelef2, clifax, cliubicacionrapido, clidirec,
                    clidirec2, website, clireferencia1, cliparentesco1, clireftelefono1,
                    clireferencia2, cliparentesco2, clireftelefono2
                FROM cxchmcli
                WHERE ciacodigo = :cia AND clicodigo = :cli
                ORDER BY clifecmsys DESC, clihormsys DESC
            """
            )
            data_completa["auditCliente"] = []
            for r in conn.execute(q_aud_cli, base_params).mappings().fetchall():
                d = dict(r)
                if d["clifecmsys"]:
                    d["clifecmsys"] = d["clifecmsys"].strftime("%Y-%m-%d")
                if d["clihormsys"]:
                    d["clihormsys"] = d["clihormsys"].strftime("%H:%M:%S")
                data_completa["auditCliente"].append(d)

            # 10. Auditoría de Descuentos por Línea (cxchbclidesc)
            q_aud_lin = text(
                """
                SELECT desaccion, desusumsys, desfecmsys, deshormsys, lincodigo, marcodigo, desporcentaje, deslistaprecio
                FROM cxchbclidesc WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY desfecmsys DESC, deshormsys DESC
            """
            )
            data_completa["auditDescLinea"] = []
            for r in conn.execute(q_aud_lin, base_params).mappings().fetchall():
                d = dict(r)
                if d["desfecmsys"]:
                    d["desfecmsys"] = d["desfecmsys"].strftime("%Y-%m-%d")
                if d["deshormsys"]:
                    d["deshormsys"] = d["deshormsys"].strftime("%H:%M:%S")
                data_completa["auditDescLinea"].append(d)

            # 11. Auditoría de Descuentos por Artículo (cxchbclidescart)
            q_aud_art = text(
                """
                SELECT desaccion, desusumsys, desfecmsys, deshormsys, artcodigo, desporcentaje, deslistaprecio
                FROM cxchbclidescart WHERE ciacodigo = :cia AND clicodigo = :cli ORDER BY desfecmsys DESC, deshormsys DESC
            """
            )
            data_completa["auditDescArt"] = []
            for r in conn.execute(q_aud_art, base_params).mappings().fetchall():
                d = dict(r)
                if d["desfecmsys"]:
                    d["desfecmsys"] = d["desfecmsys"].strftime("%Y-%m-%d")
                if d["deshormsys"]:
                    d["deshormsys"] = d["deshormsys"].strftime("%H:%M:%S")
                data_completa["auditDescArt"].append(d)

        return jsonify({"success": True, "data": data_completa}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 5. MANEJO DE IMÁGENES (TABLA cxctcliimagen)
# =================================================================
@bp.route("/uploadImagenCliente", methods=["POST"])
@jwt_required()
def upload_imagen_cliente():
    """Recibe la imagen desde React, la convierte a binario y la guarda en SQL"""
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usuario_id = claims["user"]
        bd_cliente = claims["seleccion"]["clicianonBD"]
        estacion = request.headers.get("X-Forwarded-For", request.remote_addr)[:15]

        # La imagen viaja como form-data
        clicodigo = request.form.get("clicodigo")
        archivo = request.files.get("imagen")

        if not clicodigo or not archivo:
            return jsonify({"success": False, "message": "Código de cliente e imagen requeridos"}), 400

        imagen_binaria = archivo.read()
        now = datetime.now()

        db.session = get_session(bd_cliente)
        with db.session.bind.connect() as conn:
            with conn.begin():
                # Calcular siguiente secuencia
                q_sec = text("SELECT MAX(clisecuen) as max_sec FROM cxctcliimagen WHERE ciacodigo = :cia AND clicodigo = :cli")
                res_sec = conn.execute(q_sec, {"cia": ciacodigo, "cli": clicodigo}).mappings().first()
                siguiente_secuencia = (res_sec["max_sec"] or 0) + 1

                q_insert = text(
                    """
                    INSERT INTO cxctcliimagen (
                        ciacodigo, clicodigo, clisecuen, cliimagen,
                        clifecmsys, clihormsys, cliusumsys, cliestmsys
                    ) VALUES (
                        :cia, :cli, :sec, :img,
                        :fec, :hor, :usu, :est
                    )
                """
                )
                conn.execute(q_insert, {"cia": ciacodigo, "cli": clicodigo, "sec": siguiente_secuencia, "img": imagen_binaria, "fec": now.strftime("%Y-%m-%d"), "hor": now.strftime("%H:%M:%S"), "usu": usuario_id, "est": estacion})

        return jsonify({"success": True, "message": "Imagen subida exitosamente"}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@bp.route("/getImagenesCliente", methods=["POST"])
@jwt_required()
def get_imagenes_cliente():
    """Lee el BLOB de la base de datos y lo devuelve en Base64 para que React lo pinte"""
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        payload = request.get_json() or {}
        clicodigo = payload.get("clicodigo")

        db.session = get_session(bd_cliente)
        imagenes = []

        with db.session.bind.connect() as conn:
            q_img = text(
                """
                SELECT clisecuen, cliimagen, cliusumsys, clifecmsys, clihormsys
                FROM cxctcliimagen
                WHERE ciacodigo = :cia AND clicodigo = :cli
                ORDER BY clisecuen
            """
            )
            resultados = conn.execute(q_img, {"cia": ciacodigo, "cli": clicodigo}).mappings().fetchall()

            for r in resultados:
                img_data = r["cliimagen"]
                base64_img = base64.b64encode(img_data).decode("utf-8") if img_data else None

                imagenes.append(
                    {
                        "secuencia": r["clisecuen"],
                        "usuario": r["cliusumsys"],
                        "fecha": r["clifecmsys"].strftime("%Y-%m-%d") if r["clifecmsys"] else "",
                        "hora": r["clihormsys"].strftime("%H:%M:%S") if r["clihormsys"] else "",
                        "imagenBase64": f"data:image/jpeg;base64,{base64_img}" if base64_img else None,
                    }
                )

        return jsonify({"success": True, "data": imagenes}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@bp.route("/deleteImagenCliente", methods=["POST"])
@jwt_required()
def delete_imagen_cliente():
    """Elimina una imagen específica del cliente"""
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        payload = request.get_json() or {}
        clicodigo = payload.get("clicodigo")
        clisecuen = payload.get("secuencia")

        db.session = get_session(bd_cliente)
        with db.session.bind.connect() as conn:
            with conn.begin():
                q_del = text("DELETE FROM cxctcliimagen WHERE ciacodigo = :cia AND clicodigo = :cli AND clisecuen = :sec")
                conn.execute(q_del, {"cia": ciacodigo, "cli": clicodigo, "sec": clisecuen})

        return jsonify({"success": True, "message": "Imagen eliminada"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 6. OBTENER LISTA DE CLIENTES (PARA LA GRILLA PRINCIPAL)
# =================================================================
@bp.route("/getAllClientes", methods=["POST"])
@jwt_required()
def get_all_clientes():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        payload = request.get_json() or {}

        # Ajustado al formato real del CustomConditionalActionsTableServerSide
        page = payload.get("page", 1)
        page_size = payload.get("perPage", 15)

        # Soportar si el filtro global lo envía como "search" o "globalFilter"
        global_filter = payload.get("search", payload.get("globalFilter", "")).strip()

        # Aquí atrapamos el diccionario "filters: {cliruc: '1311...', clinombre: '...'}"
        filtros_dict = payload.get("filters", {})

        # Paginación: si la página 1 es la inicial, el offset es 0
        offset = (page - 1) * page_size if page > 0 else 0

        db.session = get_session(bd_cliente)
        with db.session.bind.connect() as conn:
            where_clause = "ciacodigo = :cia"
            params = {"cia": ciacodigo}

            # 1. Filtro global (Buscador Superior)
            if global_filter:
                where_clause += " AND (clicodigo LIKE :filtro OR clinombre LIKE :filtro OR cliruc LIKE :filtro)"
                params["filtro"] = f"%{global_filter}%"

            # 2. Filtros por Columna Específica (Server-Side Filtering)
            i = 0
            # Definimos cuáles son las columnas "booleanas" que reciben SI / NO
            bool_columns = ["vendedores", "referencias", "agencias", "descuentos", "descuentosart", "historial", "imagenes", "garante"]
            columnas_validas = ["clicodigo", "cliruc", "clinombre", "clisexo", "cliestciv", "clidirec", "clitelef1", "cliemail", "clistatus", "clifecisys", "clifecmsys"] + bool_columns

            for col, val in filtros_dict.items():
                val = str(val).strip()
                if not val:
                    continue

                # Mapeo del campo virtual "Estado" al campo real en BD
                if col == "cliestado_desc":
                    col = "clistatus"
                    if val.upper() == "ACTIVO":
                        val = "A"
                    elif val.upper() == "INACTIVO":
                        val = "I"
                    elif val.upper() == "POTENCIAL":
                        val = "P"

                # LÓGICA AGREGADA: Traducción de SI/NO para columnas booleanas
                if col in bool_columns:
                    if val.upper() == "SI":
                        where_clause += f" AND {col} >= 1"
                    elif val.upper() == "NO":
                        where_clause += f" AND {col} = 0"
                    # Salta a la siguiente iteración, no aplica LIKE
                    continue

                # Seguridad: Permitir buscar solo en las columnas declaradas (Aplica LIKE a las demás)
                if col in columnas_validas:
                    p_name = f"col_val_{i}"
                    where_clause += f" AND {col} LIKE :{p_name}"
                    params[p_name] = f"%{val}%"
                    i += 1

            # 3. Total de Registros (Para que funcione el paginador de MUI)
            q_count = text(f"SELECT COUNT(*) as total FROM view_cxcmcli WHERE {where_clause}")
            total_rows = conn.execute(q_count, params).scalar()

            # 4. Obtener los Datos Filtrados
            q_data = text(
                f"""
                SELECT
                    clicodigo, cliruc, clinombre, clisexo, cliestciv,
                    clidirec, clitelef1, cliemail,
                    vendedores, referencias, agencias, descuentos, descuentosart, historial,  imagenes,  garante,
                    clistatus, clifecisys, clifecmsys
                FROM view_cxcmcli
                WHERE {where_clause}
                ORDER BY clinombre ASC
                OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
            """
            )
            params["offset"] = offset
            params["limit"] = page_size

            resultados = conn.execute(q_data, params).mappings().fetchall()

            clientes = []
            for r in resultados:
                cliente = dict(r)

                # Mapeo de estados para el Frontend
                if r["clistatus"] == "A":
                    cliente["cliestado_desc"] = "ACTIVO"
                elif r["clistatus"] == "P":
                    cliente["cliestado_desc"] = "POTENCIAL"
                elif r["clistatus"] == "I":
                    cliente["cliestado_desc"] = "INACTIVO"
                else:
                    cliente["cliestado_desc"] = r["clistatus"]

                # Formateo de fechas separadas
                cliente["clifecisys"] = r["clifecisys"].strftime("%Y-%m-%d") if r["clifecisys"] else None
                cliente["clifecmsys"] = r["clifecmsys"].strftime("%Y-%m-%d") if r["clifecmsys"] else None

                clientes.append(cliente)
        return (
            jsonify(
                {
                    "success": True,
                    "data": clientes,
                    "total": total_rows,
                    "page": page,
                    "per_page": page_size,
                    "total_pages": (total_rows + page_size - 1) // page_size,
                }
            ),
            200,
        )
        # return jsonify({"success": True, "data": clientes, "total": total_rows, "page": page, "per_page": page_size}), 200

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"success": False, "message": f"Error al cargar la lista de clientes: {str(e)}"}), 500


# =================================================================
# 7. ELIMINAR CLIENTE (CON AUDITORÍA)
# Equivalente a mnuOpcionesDelete_Click en VB6
# =================================================================
@bp.route("/deleteCliente", methods=["POST"])
@jwt_required()
def delete_cliente():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usuario_id = claims["user"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        payload = request.get_json() or {}
        clicodigo = payload.get("clicodigo")

        if not clicodigo:
            return jsonify({"success": False, "message": "Código de cliente es requerido."}), 400

        now = datetime.now()
        fecha_sys = now.strftime("%Y-%m-%d")
        hora_sys = now.strftime("%H:%M:%S")

        db.session = get_session(bd_cliente)
        with db.session.bind.connect() as conn:
            with conn.begin():
                # 1. Validar si el cliente existe y no está inactivo (Lógica VB6)
                q_check = text("SELECT clistatus, clinombre FROM cxcmcli WHERE ciacodigo = :cia AND clicodigo = :cli")
                cliente = conn.execute(q_check, {"cia": ciacodigo, "cli": clicodigo}).mappings().first()

                if not cliente:
                    return jsonify({"success": False, "message": "Cliente no encontrado."}), 404

                if cliente["clistatus"] == "I":
                    return jsonify({"success": False, "message": "No puede Eliminar un Registro INACTIVO, verifique."}), 200

                # 2. Inserción de Auditoría en cxchmcli (Exactamente como su Query en VB6)
                q_audit = text(
                    """
                    INSERT INTO cxchmcli (
                        cliaccion, ciacodigo, clicodigo, clifecisys, clihorisys, cliusuisys, clinombre,
                        cliaparta, cliruc, clidirec, clidirec2, clirepres, clitelef1, clitelef2, clifax,
                        zoncodigo, regcodigo, tipcodigo, clidiascrs, climontocrs, clisalaplis, clidiascrd, climontocrd,
                        clisalaplid, cliprefac, clistatus, clifecmsys, clihormsys, cliusumsys, website, procodigo, cliobserva, cliemail,
                        cliapliiva, clibloqueo, clifecnac, cliestciv, cliprofesion, ciucodigo, usrcodigo, cliruccon, clinombrecon, clidireccon,
                        cliprofesioncon, cliintersec, clinumestable, clirucmatriz, clinommatriz, tarenviosta, clirucrepres, cliidentifica,
                        cliidenrep, cliidencon, calificacion, activicodigo, sectorcodigo, clidiapago, clihorapagodesde,
                        clihorapagohasta, clidiasrecibefac1, clidiaentregafac, cliestisys, cliestmsys, cliconespecial, clitelpref1, clitelpref2, clitelext1, clitelext2
                    )
                    SELECT
                        'DELETE' AS cliaccion, ciacodigo, clicodigo, clifecisys, clihorisys, cliusuisys, clinombre,
                        cliaparta, cliruc, clidirec, clidirec2, clirepres, clitelef1, clitelef2, clifax,
                        zoncodigo, regcodigo, tipcodigo, clidiascrs, climontocrs, clisalaplis, clidiascrd, climontocrd,
                        clisalaplid, cliprefac, clistatus, :fec_sys AS clifecmsys, :hor_sys AS clihormsys, :usu AS cliusumsys, website, procodigo, cliobserva, cliemail,
                        cliapliiva, clibloqueo, clifecnac, cliestciv, cliprofesion, ciucodigo, usrcodigo, cliruccon, clinombrecon, clidireccon,
                        cliprofesioncon, cliintersec, clinumestable, clirucmatriz, clinommatriz, tarenviosta, clirucrepres, cliidentifica,
                        cliidenrep, cliidencon, calificacion, activicodigo, sectorcodigo, clidiapago, clihorapagodesde,
                        clihorapagohasta, clidiasrecibefac1, clidiaentregafac, cliestisys, cliestmsys, cliconespecial, clitelpref1, clitelpref2, clitelext1, clitelext2
                    FROM cxcmcli
                    WHERE ciacodigo = :cia AND clicodigo = :cli
                """
                )
                conn.execute(q_audit, {"cia": ciacodigo, "cli": clicodigo, "fec_sys": fecha_sys, "hor_sys": hora_sys, "usu": usuario_id})

                # 3. Eliminar físicamente las tablas hijas (Protección contra registros huérfanos)
                tablas_hijas = ["cxctcliven", "cxctclireferencias", "cxctclicontactos", "cxctcliagencias", "cxctclihistorial", "cxcbclidesc", "cxcbclidescart", "cxctcliimagen"]
                for tabla in tablas_hijas:
                    conn.execute(text(f"DELETE FROM {tabla} WHERE ciacodigo = :cia AND clicodigo = :cli"), {"cia": ciacodigo, "cli": clicodigo})

                # 4. Finalmente, Eliminar el Maestro de Clientes
                conn.execute(text("DELETE FROM cxcmcli WHERE ciacodigo = :cia AND clicodigo = :cli"), {"cia": ciacodigo, "cli": clicodigo})

        return jsonify({"success": True, "message": "Cliente eliminado exitosamente.", "data": {"clicodigo": clicodigo}}), 200

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"success": False, "message": f"Error al eliminar cliente: {str(e)}"}), 500


# =================================================================
# ELIMINAR HISTORIAL / COMENTARIO INDIVIDUAL
# =================================================================
@bp.route("/deleteHistorial", methods=["POST"])
@jwt_required()
def delete_historial():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        bd_cliente = claims["seleccion"]["clicianonBD"]

        payload = request.get_json() or {}
        clicodigo = payload.get("clicodigo")
        obssecuen = payload.get("obssecuen")

        if not clicodigo or not obssecuen:
            return jsonify({"success": False, "message": "Datos incompletos para eliminar."}), 400

        db.session = get_session(bd_cliente)
        with db.session.bind.connect() as conn:
            with conn.begin():
                conn.execute(text("DELETE FROM cxctclihistorial WHERE ciacodigo = :cia AND clicodigo = :cli AND obssecuen = :sec"), {"cia": ciacodigo, "cli": clicodigo, "sec": obssecuen})
        return jsonify({"success": True, "message": "Historial eliminado"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 8. ANALÍTICA DE CLIENTE BÚSQUEDA BAJO DEMANDA (Saldos, Movimientos, Protestos)
# =================================================================
@bp.route("/getAnaliticaCliente", methods=["POST"])
@jwt_required()
def get_analitica_cliente():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["seleccion"].get("loccodigo", "01")
        bd_cliente = claims["seleccion"]["clicianonBD"]

        payload = request.get_json() or {}
        clicodigo = payload.get("clicodigo")
        cliruc = payload.get("cliruc")
        # PROTESTOS, SALDOS, MOVIMIENTOS, GARANTIAS
        modulo = payload.get("modulo", "")
        f_desde = payload.get("fechaDesde")
        f_hasta = payload.get("fechaHasta")
        alcance = payload.get("alcance", "CIA")

        db.session = get_session(bd_cliente)
        resultados = []

        with db.session.bind.connect() as conn:
            # 1. Armamos el WHERE dinámico replicando los RadioButtons de VB6 (optHoja, optAnal)
            if alcance == "LOC":
                where_clause = "ciacodigo = :cia AND clicodigo = :cli AND loccodigo = :loc"
                params = {"cia": ciacodigo, "cli": clicodigo, "loc": loccodigo}
            elif alcance == "ALL":
                # Todas las compañías (Busca a través del RUC en la Vista)
                where_clause = "cliruc = :ruc"
                params = {"ruc": cliruc}
            else:
                # Default "CIA": Solo esta compañía
                where_clause = "ciacodigo = :cia AND clicodigo = :cli"
                params = {"cia": ciacodigo, "cli": clicodigo}

            # 2. Ejecutar la vista correspondiente según la pestaña consultada
            try:
                if modulo == "PROTESTOS":
                    q = text(
                        f"""
                        SELECT ciacodigo, loccodigo, facnumfac, tranumbco, obsvalche, obsnumche, obsfecisys, clicodigo, obsobserva
                        FROM cxctcliobs
                        WHERE {where_clause} AND obsfecisys >= :f_desde AND obsfecisys <= :f_hasta
                        ORDER BY obsfecisys DESC
                    """
                    )
                    params.update({"f_desde": f_desde, "f_hasta": f_hasta})
                    for r in conn.execute(q, params).mappings().fetchall():
                        d = dict(r)
                        if d.get("obsfecisys"):
                            d["obsfecisys"] = d["obsfecisys"].strftime("%Y-%m-%d")
                        if isinstance(d.get("obsvalche"), Decimal):
                            d["obsvalche"] = float(d["obsvalche"])
                        resultados.append(d)

                elif modulo == "SALDOS":
                    # 1. Rescatamos las fechas exactas enviadas desde el payload
                    fecha_desde = payload.get("fechaDesde")
                    fecha_hasta = payload.get("fechaHasta")

                    # 2. Agregamos el filtro de fechas a la cláusula dinámica si existen
                    if fecha_desde and fecha_hasta:
                        where_clause += " AND fecha >= :f_desde AND fecha <= :f_hasta"
                        params["f_desde"] = f"{fecha_desde} 00:00:00"
                        params["f_hasta"] = f"{fecha_hasta} 23:59:59"

                    # 3. La consulta suma los valores y agrupa garantizando una sola fila por Año/Mes
                    q = text(
                        f"""
                        SELECT
                            anio,
                            mes,
                            SUM(facturado) AS facturado,
                            SUM(pagado) AS pagado,
                            (SUM(facturado) - SUM(pagado)) AS diferencia,
                            SUM(proyectos) AS proyectos,
                            SUM(lineas) AS lineas
                        FROM view_cxc_analisis_saldos
                        WHERE {where_clause}
                        GROUP BY anio, mes
                        ORDER BY anio DESC, mes DESC
                        """
                    )

                    # VARIABLES ACUMULADORAS PARA LA FILA DE TOTALES
                    t_facturado = 0.0
                    t_pagado = 0.0
                    t_diferencia = 0.0
                    t_proyectos = 0.0
                    t_lineas = 0.0

                    for r in conn.execute(q, params).mappings().fetchall():
                        d = dict(r)
                        for k in ["facturado", "pagado", "diferencia", "proyectos", "lineas"]:
                            if isinstance(d.get(k), Decimal):
                                d[k] = float(d[k])

                        # Sumamos los valores de la fila actual a nuestros acumuladores
                        t_facturado += d.get("facturado", 0.0)
                        t_pagado += d.get("pagado", 0.0)
                        t_diferencia += d.get("diferencia", 0.0)
                        t_proyectos += d.get("proyectos", 0.0)
                        t_lineas += d.get("lineas", 0.0)

                        resultados.append(d)

                    # 4. Agregamos la fila final de Totales (solo si hay registros)
                    if resultados:
                        resultados.append({"anio": "TOTALES", "mes": "-", "facturado": round(t_facturado, 2), "pagado": round(t_pagado, 2), "diferencia": round(t_diferencia, 2), "proyectos": round(t_proyectos, 2), "lineas": round(t_lineas, 2)})

                elif modulo == "MOVIMIENTOS":
                    # 1. Rescatamos las fechas exactas enviadas desde el payload
                    fecha_desde = payload.get("fechaDesde")
                    fecha_hasta = payload.get("fechaHasta")

                    # 2. Agregamos el filtro de fechas
                    if fecha_desde and fecha_hasta:
                        where_clause += " AND emi >= :f_desde AND emi <= :f_hasta"
                        params["f_desde"] = f"{fecha_desde} 00:00:00"
                        params["f_hasta"] = f"{fecha_hasta} 23:59:59"

                    # 3. Consulta estructurada con ordenamiento idéntico a VB6
                    q = text(
                        f"""
                        SELECT
                            ciacodigo, loccodigo, orden, tipo, doc, emi, vence,
                            sta, valor, abono, saldo, usu, det, diasmora
                        FROM view_cxc_estado_cuenta
                        WHERE {where_clause}
                        ORDER BY orden ASC, emi ASC
                        """
                    )

                    # Acumuladores para la fila de Totales
                    t_valor = 0.0
                    t_abono = 0.0
                    t_saldo = 0.0

                    for r in conn.execute(q, params).mappings().fetchall():
                        d = dict(r)

                        # Formateo de fechas
                        if d.get("emi"):
                            d["emi"] = d["emi"].strftime("%Y-%m-%d")
                        if d.get("vence"):
                            d["vence"] = d["vence"].strftime("%Y-%m-%d")

                        # 4. Traducción de Tipo de Documento (Equivalente al Select Case de VB6)
                        tipo_cod = d.get("tipo", "")
                        if tipo_cod == "FA":
                            d["tipo_desc"] = "FACTURA"
                        elif tipo_cod == "ND":
                            d["tipo_desc"] = "NOTA/DEBITO"
                        elif tipo_cod == "AN":
                            d["tipo_desc"] = "ANTICIPO"
                        elif tipo_cod == "MO":
                            d["tipo_desc"] = "NC X MONTO"
                        elif tipo_cod == "NC":
                            d["tipo_desc"] = "NC DEVOLUCION"
                        elif tipo_cod == "DG":
                            d["tipo_desc"] = "DOC.GARANTIA"
                        elif tipo_cod == "CO":
                            d["tipo_desc"] = "COBROS"
                        else:
                            d["tipo_desc"] = f"{tipo_cod} - NO DEFINIDO"

                        # 5. Traducción de Estado (Equivalente al Select Case de VB6)
                        sta_cod = d.get("sta", "")
                        if sta_cod == "P":
                            d["sta_desc"] = "PENDIENTE"
                        elif sta_cod == "C":
                            d["sta_desc"] = "CANCELADO" if tipo_cod in ["FA", "ND"] else "APLICADO"
                        elif sta_cod == "X":
                            d["sta_desc"] = "CANJEADO"
                        else:
                            d["sta_desc"] = f"{sta_cod} - NO DEFINIDO"

                        # 6. Conversión Decimal y Acumuladores
                        for k in ["valor", "abono", "saldo", "diasmora"]:
                            if isinstance(d.get(k), Decimal):
                                d[k] = float(d[k])

                        t_valor += d.get("valor", 0.0)
                        t_abono += d.get("abono", 0.0)
                        t_saldo += d.get("saldo", 0.0)

                        resultados.append(d)

                    # 7. Agregar fila final de Totales
                    if resultados:
                        resultados.append({"doc": "TOTALES", "emi": "-", "vence": "-", "tipo_desc": "-", "sta_desc": "-", "usu": "-", "det": "-", "valor": round(t_valor, 2), "abono": round(t_abono, 2), "saldo": round(t_saldo, 2), "diasmora": 0})

                elif modulo == "GARANTIAS":
                    q = text(
                        f"""
                        SELECT ciacodigo, loccodigo, cxcnumcomp AS facnumfac, cxcvalor AS factotal,
                               0 AS facabono, 0 AS facsaldo, cxcfecemi AS facfecemi,
                               clicodigo, cxcdetalle AS facdetalle,
                               (SELECT TOP 1 clinombre FROM cxcmcli m WHERE m.ciacodigo = view_cxc_cabecera_docgarantia.ciacodigo AND m.clicodigo = view_cxc_cabecera_docgarantia.clicodigo) AS clinombre
                        FROM view_cxc_cabecera_docgarantia
                        WHERE {where_clause} AND cxcfecemi >= :f_desde AND cxcfecemi <= :f_hasta
                        ORDER BY cxcfecemi DESC
                    """
                    )
                    params.update({"f_desde": f_desde, "f_hasta": f_hasta})
                    for r in conn.execute(q, params).mappings().fetchall():
                        d = dict(r)
                        if d.get("facfecemi"):
                            d["facfecemi"] = d["facfecemi"].strftime("%Y-%m-%d")
                        for k in ["factotal", "facabono", "facsaldo"]:
                            if isinstance(d.get(k), Decimal):
                                d[k] = float(d[k])
                        resultados.append(d)

            except Exception as e:
                import traceback

                traceback.print_exc()
                return jsonify({"success": False, "message": str(e)}), 200

        return jsonify({"success": True, "data": resultados}), 200

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500
