from flask import request, jsonify
from app.NotaDebitoDF import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/guardarNotaDebito", methods=["POST"])
@jwt_required()
def guardar_nota_debito():
    """Guarda la Nota de Débito con información clonada de la factura original y configuración SRI"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]

        usuario_sys = claims.get("sub", claims.get("user_id", "SISTEMA"))[:10]

        # OBTENER IP DEL USUARIO PARA facestisys / facestmsys
        ip_raw = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
        ip_user = ip_raw.split(",")[0].strip()[:30]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        payload = request.get_json()
        if not payload:
            return jsonify({"success": False, "message": "No se recibieron datos."}), 400

        # --- Extracción de Datos del Payload ---
        facnumfac = payload.get("facnumfac", "").strip()
        facnumref = payload.get("facnumref", "").strip()
        cjacodigo = payload.get("cjacodigo", "").strip()
        factippag = payload.get("formaPago", "").strip()
        vendedor = payload.get("vendedor", {})
        vencodigo = vendedor.get("vencodigo", "").strip()
        cliente = payload.get("cliente", {})
        clicodigo = cliente.get("clicodigo", "").strip()
        observacion = payload.get("observacion", "").strip()
        servicios = payload.get("servicios", [])

        if not facnumfac or not cjacodigo or not servicios or not facnumref:
            return jsonify({"success": False, "message": "Datos incompletos para guardar."}), 400

        # --- Motor de Cálculos (Backend) ---
        factivacer = 0.0
        factivapor = 0.0
        facsubtot = 0.0
        facdesglobal = 0.0
        faciva = 0.0
        factotal = 0.0

        # Regla: Tomamos el % de IVA del único servicio permitido
        facporiva = float(servicios[0].get("ivaPorcentaje", 0)) if servicios else 0.0

        lineas_detalle = []
        secuencia = 1

        for s in servicios:
            cant = float(s.get("cantidad", 0))
            precio = float(s.get("precioUnitario", 0))
            desc_porc = float(s.get("descuentoPorcentaje", 0))
            iva_porc = float(s.get("ivaPorcentaje", 0))
            sercodigo = str(s.get("sercodigo", "")).strip()

            sub_p = round(cant * precio, 2)
            desc_p = round(sub_p * (desc_porc / 100.0), 2)
            base_imponible = round(sub_p - desc_p, 2)
            iva_p = round(base_imponible * (iva_porc / 100.0), 2)
            total_linea = round(base_imponible + iva_p, 2)

            facsubtot += sub_p
            facdesglobal += desc_p
            faciva += iva_p

            if iva_porc > 0:
                factivapor += base_imponible
            else:
                factivacer += base_imponible

            lineas_detalle.append({"secuencia": secuencia, "sercodigo": sercodigo, "faccantidad": cant, "facpreven": precio, "facpordesc": desc_porc, "facvaldesc": desc_p, "faciva": iva_porc, "facvaliva": iva_p, "facvalor": base_imponible, "facvaltot": total_linea})
            secuencia += 1

        facsubtot = round(facsubtot, 2)
        facdesglobal = round(facdesglobal, 2)
        faciva = round(faciva, 2)
        factotal = round(factivapor + factivacer + faciva, 2)

        # Regla: Separación estricta de Fecha y Hora
        ahora = datetime.now()
        fecha_solo = ahora.strftime("%Y-%m-%d")
        hora_solo = ahora.strftime("1900-01-01 %H:%M:%S")

        # ==========================================
        # TRANSACCIÓN DE BASE DE DATOS
        # ==========================================
        with engine.begin() as connection:

            # --- 1. RESCATAR SECUENCIA SRI DE LA CAJA ---
            sql_series = text(
                """
                SELECT sriserie01, sriserie02, srisecini, srisecfin, srisecact, sriautfecemi, sriautfecven
                FROM siactsriseries
                WHERE ciacodigo = :ciacodigo AND cjacodigo = :cjacodigo AND srisecdoc = '05'
            """
            )
            serie = connection.execute(sql_series, {"ciacodigo": ciacodigo, "cjacodigo": cjacodigo}).mappings().first()
            if not serie:
                raise Exception("No existe configuración de series SRI para la caja seleccionada.")

            # CORRECCIÓN: Calculamos el nuevo número de factura (srisecact + 1) para el campo facnumero
            srisecact_actual = int(serie["srisecact"] or 0)
            nuevo_facnumero = srisecact_actual + 1

            # --- 2. CLONAR DATOS DE LA FACTURA ORIGINAL ---
            sql_inv = text(
                """
                SELECT regcodigo, ciucodigo, procodigo, clinombre, cliruc, clidirec, cliemail,
                       ciaciaruc, ciaciadescri, ciaciadirec, ciaciatelefono1, ciaciaciudad, ciaciapais,
                       locdescri, locciadirec, locciatelefono1, locciaciudad, locciapais, cianumresolucion
                FROM facfac
                WHERE ciacodigo = :ciacodigo AND facnumfac = :facnumref
            """
            )
            inv = connection.execute(sql_inv, {"ciacodigo": ciacodigo, "facnumref": facnumref}).mappings().first()
            if not inv:
                raise Exception("No se encontró la factura original en la base de datos.")

            # --- 3. ACTUALIZAR SECUENCIA SRI ---
            sql_update_seq = text(
                """
                UPDATE siactsriseries
                SET srisecact = srisecact + 1
                WHERE ciacodigo = :ciacodigo
                  AND cjacodigo = :cjacodigo
                  AND srisecdoc = '05'
            """
            )
            connection.execute(sql_update_seq, {"ciacodigo": ciacodigo, "cjacodigo": cjacodigo})

            # --- 4. INSERTAR EN FACFAC (CABECERA COMPLETA) ---
            sql_insert_facfac = text(
                """
                INSERT INTO facfac (
                    ciacodigo, facnumfac, factipo, factippag, moncodigo, clicodigo, loccodigo,
                    garcodigo, faccambio, facfecemi, facfecven, factivacer, factivapor,
                    facsubtot, faciva, factotal, facabono, facsaldo, facvalnc, facstatus,
                    facdetalle, facfecisys, fachorisys, facusuisys, facestisys,
                    facfecmsys, fachormsys, facusumsys, facestmsys, vencodigo, cjacodigo,
                    seqcodigo, tipcodigo, facnumref, integracodigo, proyectocodigo,
                    facpordes, facdesglobal, facdesdirecto, facrecargo, facnumero, facporiva,
                    sriserie01, sriserie02, srisecini, srisecfin, sriautfecemi, sriautfecven,
                    regcodigo, ciucodigo, procodigo, clinombre, cliruc, clidirec, cliemail,
                    ciaciaruc, ciaciadescri, ciaciadirec, ciaciatelefono1, ciaciaciudad, ciaciapais,
                    locdescri, locciadirec, locciatelefono1, locciaciudad, locciapais, cianumresolucion
                ) VALUES (
                    :ciacodigo, :facnumfac, 'ND', :factippag, 'D', :clicodigo, :loccodigo,
                    '', 0.0, :fecha_solo, :fecha_solo, :factivacer, :factivapor,
                    :facsubtot, :faciva, :factotal, 0.0, :factotal, 0.0, 'A',
                    :facdetalle, :fecha_solo, :hora_solo, :usuario_sys, :ip_user,
                    :fecha_solo, :hora_solo, :usuario_sys, :ip_user, :vencodigo, :cjacodigo,
                    '', '', :facnumref, '000', '000',
                    0.0, :facdesglobal, 0.0, 0.0, :facnumero, :facporiva,
                    :sriserie01, :sriserie02, :srisecini, :srisecfin, :sriautfecemi, :sriautfecven,
                    :regcodigo, :ciucodigo, :procodigo, :clinombre, :cliruc, :clidirec, :cliemail,
                    :ciaciaruc, :ciaciadescri, :ciaciadirec, :ciaciatelefono1, :ciaciaciudad, :ciaciapais,
                    :locdescri, :locciadirec, :locciatelefono1, :locciaciudad, :locciapais, :cianumresolucion
                )
            """
            )

            connection.execute(
                sql_insert_facfac,
                {
                    "ciacodigo": ciacodigo,
                    "facnumfac": facnumfac,
                    "factippag": factippag,
                    "clicodigo": clicodigo,
                    "loccodigo": loccodigo,
                    "fecha_solo": fecha_solo,
                    "hora_solo": hora_solo,
                    "factivacer": factivacer,
                    "factivapor": factivapor,
                    "facsubtot": facsubtot,
                    "faciva": faciva,
                    "factotal": factotal,
                    "facdetalle": observacion,
                    "usuario_sys": usuario_sys,
                    "ip_user": ip_user,
                    "vencodigo": vencodigo,
                    "cjacodigo": cjacodigo,
                    "facnumref": facnumref,
                    "facdesglobal": facdesglobal,
                    "facnumero": nuevo_facnumero,
                    "facporiva": facporiva,  # <-- AQUÍ SE INYECTA EL NUEVO NÚMERO
                    "sriserie01": serie["sriserie01"],
                    "sriserie02": serie["sriserie02"],
                    "srisecini": serie["srisecini"],
                    "srisecfin": serie["srisecfin"],
                    "sriautfecemi": serie["sriautfecemi"],
                    "sriautfecven": serie["sriautfecven"],
                    "regcodigo": inv["regcodigo"],
                    "ciucodigo": inv["ciucodigo"],
                    "procodigo": inv["procodigo"],
                    "clinombre": inv["clinombre"],
                    "cliruc": inv["cliruc"],
                    "clidirec": inv["clidirec"],
                    "cliemail": inv["cliemail"],
                    "ciaciaruc": inv["ciaciaruc"],
                    "ciaciadescri": inv["ciaciadescri"],
                    "ciaciadirec": inv["ciaciadirec"],
                    "ciaciatelefono1": inv["ciaciatelefono1"],
                    "ciaciaciudad": inv["ciaciaciudad"],
                    "ciaciapais": inv["ciaciapais"],
                    "locdescri": inv["locdescri"],
                    "locciadirec": inv["locciadirec"],
                    "locciatelefono1": inv["locciatelefono1"],
                    "locciaciudad": inv["locciaciudad"],
                    "locciapais": inv["locciapais"],
                    "cianumresolucion": inv["cianumresolucion"],
                },
            )

            # --- 5. INSERTAR EN FATFAC (DETALLES) ---
            sql_insert_fatfac = text(
                """
                INSERT INTO fatfac (
                    ciacodigo, facnumfac, facsecuen, factipo, factippag, moncodigo,
                    faccambio, facfecemi, clicodigo, loccodigo, cliprecio, facstatus,
                    sercodigo, lincodigo, faccantidad, faccosto, faccostodol, facpreven,
                    facvalnc, faccantnc, facvaldesglo, facvaldesc, facvalrec, faciva,
                    facvaliva, facvalor, facvaltot, facfecisys, fachorisys, facusuisys,
                    facestisys, facfecmsys, fachormsys, facusumsys, facestmsys,
                    integracodigo, proyectocodigo, facpordesc
                ) VALUES (
                    :ciacodigo, :facnumfac, :facsecuen, 'ND', :factippag, 'D',
                    0.0, :fecha_solo, :clicodigo, :loccodigo, 1, 'A',
                    :sercodigo, 'SER', :faccantidad, 0.0, 0.0, :facpreven,
                    0.0, 0.0, 0.0, :facvaldesc, 0.0, :faciva,
                    :facvaliva, :facvalor, :facvaltot, :fecha_solo, :hora_solo, :usuario_sys,
                    :ip_user, :fecha_solo, :hora_solo, :usuario_sys, :ip_user,
                    '000', '000', :facpordesc
                )
            """
            )

            for dt in lineas_detalle:
                connection.execute(
                    sql_insert_fatfac,
                    {
                        "ciacodigo": ciacodigo,
                        "facnumfac": facnumfac,
                        "facsecuen": dt["secuencia"],
                        "factippag": factippag,
                        "fecha_solo": fecha_solo,
                        "hora_solo": hora_solo,
                        "clicodigo": clicodigo,
                        "loccodigo": loccodigo,
                        "sercodigo": dt["sercodigo"],
                        "faccantidad": dt["faccantidad"],
                        "facpreven": dt["facpreven"],
                        "facpordesc": dt["facpordesc"],
                        "facvaldesc": dt["facvaldesc"],
                        "faciva": dt["faciva"],
                        "facvaliva": dt["facvaliva"],
                        "facvalor": dt["facvalor"],
                        "facvaltot": dt["facvaltot"],
                        "usuario_sys": usuario_sys,
                        "ip_user": ip_user,
                    },
                )

        return jsonify({"success": True, "data": {"facnumfac": facnumfac, "facnumref": facnumref, "total": factotal}, "message": "Nota de Débito guardada exitosamente."})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error transaccional: {str(e)}"}), 500
