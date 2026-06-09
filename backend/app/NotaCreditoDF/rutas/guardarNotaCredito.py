from flask import request, jsonify
from app.NotaCreditoDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime


@bp.route("/guardarNotaCredito", methods=["POST"])
@cross_origin()
@jwt_required()
def guardar_nota_credito():
    """Guarda la Nota de Crédito discriminando entre Monto (Servicio) o Devolución (Productos)"""
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        loccodigo = claims["localidad"]["loccodigo"]
        usuario_sys = claims.get("sub", claims.get("user_id", "SISTEMA"))[:10]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        payload = request.get_json()
        if not payload:
            return jsonify({"success": False, "message": "No se recibieron datos."}), 400

        # --- Extracción de Datos Principales ---
        tipo_nota = payload.get("tipoNota", "DEVOLUCION").strip()
        facnumfac = payload.get("facnumfac", "").strip()
        cjacodigo = payload.get("cjacodigo", "").strip()
        vendedor = payload.get("vendedor", {})
        vencodigo = vendedor.get("vencodigo", "").strip()
        cliente = payload.get("cliente", {})
        clicodigo = cliente.get("clicodigo", "").strip()
        observacion = payload.get("observacion", "").strip()
        detalles = payload.get("detalles", [])

        if not facnumfac or not cjacodigo or not detalles:
            return jsonify({"success": False, "message": "Datos incompletos para guardar."}), 400

        # --- Motor de Cálculos (Backend) ---
        nctivacer = 0.0
        nctivapor = 0.0
        ncsubtot = 0.0
        ncdesglobal = 0.0
        nctotiva = 0.0
        ncporiva = float(detalles[0].get("ivaPorcentaje", 0)) if detalles else 0.0

        lineas_detalle = []
        secuencia = 1

        for d in detalles:
            cant = float(d.get("cantidad", 0))
            precio = float(d.get("precioUnitario", 0))
            desc_porc = float(d.get("descuentoPorcentaje", 0))
            iva_porc = float(d.get("ivaPorcentaje", 0))

            codigo_identificador = str(d.get("codigo", "")).strip()

            sub_p = round(cant * precio, 2)
            desc_p = round(sub_p * (desc_porc / 100.0), 2)
            base_imponible = round(sub_p - desc_p, 2)
            iva_p = round(base_imponible * (iva_porc / 100.0), 2)
            total_linea = round(base_imponible + iva_p, 2)

            ncsubtot += sub_p
            ncdesglobal += desc_p
            nctotiva += iva_p

            if iva_porc > 0:
                nctivapor += base_imponible
            else:
                nctivacer += base_imponible

            lineas_detalle.append(
                {
                    "secuencia": secuencia,
                    "codigo": codigo_identificador,
                    "cantidad": cant,
                    "precio": precio,
                    "desc_porc": desc_porc,
                    "desc_val": desc_p,
                    "iva_porc": iva_porc,
                    "iva_val": iva_p,
                    "base_imp": base_imponible,
                    "total": total_linea,
                    "invcodigo": d.get("invcodigo", "01"),
                    "bodcodigo": d.get("bodcodigo", "MAT"),
                    "facsecuen": d.get("facsecuen", 0),
                    "artdescri": d.get("descripcion", "")[:250],
                }
            )
            secuencia += 1

        ncsubtot = round(ncsubtot, 2)
        ncdesglobal = round(ncdesglobal, 2)
        nctotiva = round(nctotiva, 2)
        ncmonto = round(nctivapor + nctivacer + nctotiva, 2)

        ahora = datetime.now()
        fecha_solo = ahora.strftime("%Y-%m-%d")
        hora_solo = ahora.strftime("1900-01-01 %H:%M:%S")

        with engine.begin() as connection:
            # 1. ACTUALIZAR Y OBTENER SECUENCIA (Doc 04)
            sql_series = text(
                """
                SELECT sriserie01, sriserie02, srisecini, srisecfin, srisecact, sriautfecemi, sriautfecven, sriautnumero
                FROM siactsriseries
                WHERE ciacodigo = :ciacodigo AND cjacodigo = :cjacodigo AND srisecdoc = '04'
            """
            )
            serie = connection.execute(sql_series, {"ciacodigo": ciacodigo, "cjacodigo": cjacodigo}).mappings().first()
            if not serie:
                raise Exception("No existe configuración de series SRI para la caja seleccionada (Doc 04).")

            srisecact_actual = int(serie.get("srisecact") or 0)
            nuevo_ncnumero = srisecact_actual + 1

            connection.execute(text("UPDATE siactsriseries SET srisecact = :nuevo WHERE ciacodigo = :ciacodigo AND cjacodigo = :cjacodigo AND srisecdoc = '04'"), {"nuevo": nuevo_ncnumero, "ciacodigo": ciacodigo, "cjacodigo": cjacodigo})

            # 2. EXTRACCIÓN SEGURA Y AISLADA DE DATOS
            sql_fac = text(
                """
                SELECT sriserie01, sriserie02, srisecini, srisecfin, sriautfecemi, sriautfecven, sriautnumero, facnumero
                FROM facfac
                WHERE ciacodigo = :ciacodigo AND facnumfac = :facnumfac AND loccodigo = :loccodigo
            """
            )
            fac_data = connection.execute(sql_fac, {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo}).mappings().first()
            if not fac_data:
                raise Exception("No se encontró la factura original.")

            # CAMBIO APLICADO: Se cambió ciaobligadocon por ciacontabilidad
            sql_cia = text("SELECT ciaruc, ciadescri, ciadirec, ciatelefono1, ciaciudad, ciapais, ciacontabilidad FROM siaccia WHERE ciacodigo = :ciacodigo")
            cia_data = connection.execute(sql_cia, {"ciacodigo": ciacodigo}).mappings().first() or {}

            sql_loc = text("SELECT locdescri, ciadirec, ciatelefono1, ciaciudad, ciapais FROM cgblocal WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo")
            loc_data = connection.execute(sql_loc, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().first() or {}

            sql_cli = text("SELECT clinombre, cliruc, clidirec, cliemail FROM cxcmcli WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo")
            cli_data = connection.execute(sql_cli, {"ciacodigo": ciacodigo, "clicodigo": clicodigo}).mappings().first() or {}

            # Generar el código de cabecera de la NC
            year = ahora.strftime("%y")
            sriserie01_nc = str(serie.get("sriserie01", "001")).strip()
            sriserie02_nc = str(serie.get("sriserie02", "001")).strip()
            nccodigo = f"C{year}{sriserie01_nc}{sriserie02_nc}{nuevo_ncnumero:09}"

            # 3. INSERTAR CABECERA (cxccnc)
            sql_insert_cxccnc = text(
                """
                INSERT INTO cxccnc (
                    ciacodigo, nccodigo, clicodigo, loccodigo, garcodigo, facnumfac, ncabono,
                    seqcodigo, seqmonto, ncdetalle, ncfecemi, ncfecsys, nchorsys, ncmonto, ncsaldo,
                    ncstatus, ncsubtot, moncodigo, nctivacer, nctivapor, nctotiva, ncusuisys,
                    vencodigo, cjacodigo, ncdesglobal, ncporiva, ncnumero, ncelectronica,
                    fasriserie01, fasriserie02, fasrisecini, fasrisecfin, fasriautfecemi, fasriautfecven, fasriautnumero,
                    sriserie01, sriserie02, srisecini, srisecfin, sriautfecemi, sriautfecven, sriautnumero,
                    integracodigo, proyectocodigo, ciaobligadocon,
                    clinombre, cliruc, clidirec, cliemail,
                    ciaciaruc, ciaciadescri, ciaciadirec, ciaciatelefono1, ciaciaciudad, ciaciapais,
                    locdescri, locciadirec, locciatelefono1, locciaciudad, locciapais, cianumresolucion
                ) VALUES (
                    :ciacodigo, :nccodigo, :clicodigo, :loccodigo, :clicodigo, :facnumfac, 0.0,
                    'NC', 2, :ncdetalle, :fecha_solo, :fecha_solo, :hora_solo, :ncmonto, :ncmonto,
                    'A', :ncsubtot, 'D', :nctivacer, :nctivapor, :nctotiva, :usuario_sys,
                    :vencodigo, :cjacodigo, :ncdesglobal, :ncporiva, :ncnumero, 0,
                    :fasriserie01, :fasriserie02, :fasrisecini, :fasrisecfin, :fasriautfecemi, :fasriautfecven, :fasriautnumero,
                    :sriserie01, :sriserie02, :srisecini, :srisecfin, :sriautfecemi, :sriautfecven, :sriautnumero,
                    '000', '000', :ciaobligadocon,
                    :clinombre, :cliruc, :clidirec, :cliemail,
                    :ciaciaruc, :ciaciadescri, :ciaciadirec, :ciaciatelefono1, :ciaciaciudad, :ciaciapais,
                    :locdescri, :locciadirec, :locciatelefono1, :locciaciudad, :locciapais, :cianumresolucion
                )
            """
            )

            connection.execute(
                sql_insert_cxccnc,
                {
                    "ciacodigo": ciacodigo,
                    "nccodigo": nccodigo,
                    "clicodigo": clicodigo,
                    "loccodigo": loccodigo,
                    "facnumfac": facnumfac,
                    "ncdetalle": observacion,
                    "fecha_solo": fecha_solo,
                    "hora_solo": hora_solo,
                    "ncmonto": ncmonto,
                    "ncsubtot": ncsubtot,
                    "nctivacer": nctivacer,
                    "nctivapor": nctivapor,
                    "nctotiva": nctotiva,
                    "usuario_sys": usuario_sys,
                    "vencodigo": vencodigo,
                    "cjacodigo": cjacodigo,
                    "ncdesglobal": ncdesglobal,
                    "ncporiva": ncporiva,
                    "ncnumero": nuevo_ncnumero,
                    # FACTURA ORIGEN
                    "fasriserie01": str(fac_data.get("sriserie01", "001")).strip(),
                    "fasriserie02": str(fac_data.get("sriserie02", "001")).strip(),
                    "fasrisecini": int(fac_data.get("facnumero") or 1),
                    "fasrisecfin": int(fac_data.get("facnumero") or 1),
                    "fasriautfecemi": fac_data.get("sriautfecemi") or fecha_solo,
                    "fasriautfecven": fac_data.get("sriautfecven") or fecha_solo,
                    "fasriautnumero": str(fac_data.get("sriautnumero", "")).strip(),
                    # SRI NOTA DE CRÉDITO
                    "sriserie01": sriserie01_nc,
                    "sriserie02": sriserie02_nc,
                    "srisecini": int(serie.get("srisecini") or 1),
                    "srisecfin": int(serie.get("srisecfin") or 999999999),
                    "sriautfecemi": serie.get("sriautfecemi") or fecha_solo,
                    "sriautfecven": serie.get("sriautfecven") or fecha_solo,
                    "sriautnumero": str(serie.get("sriautnumero", "")).strip(),
                    # METADATOS EMPRESA / CLIENTE
                    # CAMBIO APLICADO: Extrayendo de ciacontabilidad
                    "ciaobligadocon": int(cia_data.get("ciacontabilidad") or 0),
                    "clinombre": str(cli_data.get("clinombre", "")).strip(),
                    "cliruc": str(cli_data.get("cliruc", "")).strip(),
                    "clidirec": str(cli_data.get("clidirec", "")).strip(),
                    "cliemail": str(cli_data.get("cliemail", "")).strip(),
                    "ciaciaruc": str(cia_data.get("ciaruc", "")).strip(),
                    "ciaciadescri": str(cia_data.get("ciadescri", "")).strip(),
                    "ciaciadirec": str(cia_data.get("ciadirec", "")).strip(),
                    "ciaciatelefono1": str(cia_data.get("ciatelefono1", "")).strip(),
                    "ciaciaciudad": str(cia_data.get("ciaciudad", "")).strip(),
                    "ciaciapais": str(cia_data.get("ciapais", "")).strip(),
                    "locdescri": str(loc_data.get("locdescri", "")).strip(),
                    "locciadirec": str(loc_data.get("ciadirec", "")).strip(),
                    "locciatelefono1": str(loc_data.get("ciatelefono1", "")).strip(),
                    "locciaciudad": str(loc_data.get("ciaciudad", "")).strip(),
                    "locciapais": str(loc_data.get("ciapais", "")).strip(),
                    "cianumresolucion": "",
                },
            )

            # 4. INSERTAR DETALLES Y KARDEX
            sql_insert_cxctnc = text(
                """
                INSERT INTO cxctnc (
                    ciacodigo, nccodigo, ncsecuen, seqcodigo, seqmonto, clicodigo, loccodigo, garcodigo,
                    facnumfac, ncfecemi, ncfecisys, nchorisys, ncstatus, ncusrisys,
                    ncsubtot, ncvalor, sercodigo, artcodigo, invcodigo, bodcodigo, artcantidad,
                    artcosto, artcostodol, artpvp, artiva, artivamonto, lincodigo,
                    facvaldesglo, facvaldesc, facpordeslin, facsecuen, integracodigo, proyectocodigo, artdescri
                ) VALUES (
                    :ciacodigo, :nccodigo, :ncsecuen, 'NC', 2, :clicodigo, :loccodigo, :clicodigo,
                    :facnumfac, :fecha_solo, :fecha_solo, :hora_solo, 'A', :usuario_sys,
                    :ncsubtot, :ncvalor, :sercodigo, :artcodigo, :invcodigo, :bodcodigo, :artcantidad,
                    0.0, 0.0, :artpvp, :artiva, :artivamonto, :lincodigo,
                    0.0, :facvaldesc, :facpordeslin, :facsecuen, '000', '000', :artdescri
                )
            """
            )

            for dt in lineas_detalle:
                # Regla: Si es 'MONTO', sercodigo tiene valor y artcodigo es NULL. Si es 'DEVOLUCION', es al revés.
                ser_code = dt["codigo"] if tipo_nota == "MONTO" else None
                art_code = dt["codigo"] if tipo_nota == "DEVOLUCION" else None
                lin_code = "SER" if tipo_nota == "MONTO" else "010101"

                connection.execute(
                    sql_insert_cxctnc,
                    {
                        "ciacodigo": ciacodigo,
                        "nccodigo": nccodigo,
                        "ncsecuen": dt["secuencia"],
                        "clicodigo": clicodigo,
                        "loccodigo": loccodigo,
                        "facnumfac": facnumfac,
                        "fecha_solo": fecha_solo,
                        "hora_solo": hora_solo,
                        "usuario_sys": usuario_sys,
                        "ncsubtot": dt["base_imp"],
                        "ncvalor": dt["total"],
                        "sercodigo": ser_code,
                        "artcodigo": art_code,
                        "invcodigo": dt["invcodigo"],
                        "bodcodigo": dt["bodcodigo"],
                        "artcantidad": dt["cantidad"],
                        "artpvp": dt["precio"],
                        "artiva": dt["iva_porc"],
                        "artivamonto": dt["iva_val"],
                        "lincodigo": lin_code,
                        "facvaldesc": dt["desc_val"],
                        "facpordeslin": dt["desc_porc"],
                        "facsecuen": dt["facsecuen"],
                        "artdescri": dt["artdescri"],
                    },
                )

                # Kardex: Solo afectamos fatfac si es devolución de productos
                if tipo_nota == "DEVOLUCION" and art_code:
                    sql_update_fatfac = text(
                        """
                        UPDATE fatfac
                        SET faccantnc = COALESCE(faccantnc, 0) + :cantidad,
                            facvalnc = COALESCE(facvalnc, 0) + :valor
                        WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo AND facnumfac = :facnumfac AND artcodigo = :artcodigo AND facsecuen = :facsecuen
                    """
                    )
                    connection.execute(sql_update_fatfac, {"cantidad": dt["cantidad"], "valor": dt["total"], "ciacodigo": ciacodigo, "loccodigo": loccodigo, "facnumfac": facnumfac, "artcodigo": art_code, "facsecuen": dt["facsecuen"]})

        return jsonify({"success": True, "data": {"nccodigo": nccodigo}, "message": "Nota de Crédito generada exitosamente."})

    except Exception as e:
        return jsonify({"success": False, "message": f"Error transaccional: {str(e)}"}), 500
