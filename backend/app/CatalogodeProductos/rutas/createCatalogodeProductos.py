import base64
from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createCatalogodeProductos", methods=["POST"])
@jwt_required()
@api_endpoint
def createCatalogodeProductos():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    invcodigo = str(data.get("invcodigo", "")).strip().upper()[:2]
    artdescri = str(data.get("artdescri", "")).strip().upper()[:300]
    lincodigo = str(data.get("lincodigo", "")).strip().upper()[:20]
    marcodigo = str(data.get("marcodigo", "")).strip().upper()[:5]
    medcodigo = str(data.get("medcodigo", "")).strip().upper()[:3]
    precodigo = str(data.get("precodigo", "")).strip().upper()[:2]

    artprodven = int(data.get("artprodven", 1))
    artservicio = int(data.get("artservicio", 0))

    if not invcodigo:
        raise ValidationError("Debe seleccionar un Inventario (invcodigo).")
    if not artdescri:
        raise ValidationError("La Descripción del Artículo es obligatoria.")
    if not lincodigo or not marcodigo or not medcodigo or not precodigo:
        raise ValidationError("Línea, Marca, Medida y Presentación son obligatorios.")

    # Colecciones extraídas del frontend
    imagenes = data.get("imagenes", [])
    documentos_pdf = data.get("documentos_pdf", [])
    proveedores = data.get("proveedores", [])
    barras = data.get("barras", [])
    sustitutos = data.get("sustitutos", [])
    principios = data.get("principios", [])

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # =================================================================
            # A. LÓGICA DE CÓDIGO Y SECUENCIA (REPLICA VB6)
            # =================================================================
            sql_cia = text("SELECT codartsec FROM siaccia WITH (NOLOCK) WHERE ciacodigo = :ciacodigo")
            row_cia = connection.execute(sql_cia, {"ciacodigo": sCodCia}).mappings().fetchone()
            codartsec = int(row_cia["codartsec"]) if row_cia and row_cia["codartsec"] is not None else 0

            if codartsec != 0:
                seccodigo = "ART" if artprodven == 1 else "ACI"

                # UPDLOCK previene bloqueos por concurrencia
                sql_sec = text(
                    """
                    SELECT secnumero FROM siacsec WITH (UPDLOCK)
                    WHERE ciacodigo = :ciacodigo AND locservidor = 'A' AND seccodigo = :seccodigo
                """
                )
                row_sec = connection.execute(sql_sec, {"ciacodigo": sCodCia, "seccodigo": seccodigo}).mappings().fetchone()

                if not row_sec or row_sec["secnumero"] is None:
                    raise ValidationError("No se pudo generar el Código del Artículo, verifique en el módulo de Seguridad las Secuencias Internas.")

                # Le sumamos 1 a la secuencia actual para crear el nuevo código
                sec_actual = int(row_sec["secnumero"])
                sec_nueva = sec_actual + 1
                artcodigo = str(sec_nueva)

                # Incrementar la secuencia real con el nuevo valor
                sql_upd = text(
                    """
                    UPDATE siacsec SET secnumero = :secnueva
                    WHERE ciacodigo = :ciacodigo AND locservidor = 'A' AND seccodigo = :seccodigo
                """
                )
                connection.execute(
                    sql_upd,
                    {
                        "secnueva": sec_nueva,
                        "ciacodigo": sCodCia,
                        "seccodigo": seccodigo,
                    },
                )
            else:
                artcodigo = str(data.get("artcodigo", "")).strip().upper()[:15]
                if not artcodigo:
                    raise ValidationError("El Código del Artículo es obligatorio.")

            # =================================================================
            # B. VALIDACIÓN DE DUPLICADOS EN INMART
            # =================================================================
            sql_check = text(
                """
                SELECT artcodigo FROM inmart WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                """
            )
            existe = connection.execute(
                sql_check,
                {
                    "ciacodigo": sCodCia,
                    "invcodigo": invcodigo,
                    "artcodigo": artcodigo,
                },
            ).fetchone()

            if existe:
                raise ValidationError(f"El artículo '{artcodigo}' ya existe en el inventario '{invcodigo}'.")

            # =================================================================
            # C. INSERCIÓN DE LA CABECERA (inmart)
            # =================================================================
            data_inmart = {
                "ciacodigo": sCodCia,
                "invcodigo": invcodigo,
                "artcodigo": artcodigo,
                "artnumparte": str(data.get("artnumparte", ""))[:120],
                "artdescri": artdescri,
                "lincodigo": lincodigo,
                "marcodigo": marcodigo,
                "medcodigo": medcodigo,
                "precodigo": precodigo,
                "artpeso": float(data.get("artpesogm2", 0.0)),
                "artminimo": float(data.get("artminimo", 0.0)),
                "artmaximo": float(data.get("artmaximo", 0.0)),
                "artdiasrep": int(data.get("artdiasrep", 0)),
                "artdiasseg": int(data.get("artdiaseg", 0)),
                "artfrelleg": int(data.get("artfrecllegada", 0)),
                "artcantinicial": 0.0,
                "artcantactual": 0.0,
                "artcanttranfer": 0.0,
                "artcantimporta": 0.0,
                "artstatus": str(data.get("artstatus", "A"))[:1],
                "artprodven": artprodven,
                "artservicio": artservicio,
                "artapliiva": int(data.get("artapliiva", 1)),
                "artcobraiva": 0.0,
                "artcostoinicial": 0.0,
                "artcostoactual": 0.0,
                "artcostoinidol": 0.0,
                "artcostoactdol": 0.0,
                "artprecventa1": float(data.get("artprecventa1", 0.0)),
                "artprecventa2": float(data.get("artprecventa2", 0.0)),
                "artprecventa3": float(data.get("artprecventa3", 0.0)),
                "artprecventa4": float(data.get("artprecventa4", 0.0)),
                "artprecventa5": float(data.get("artprecventa5", 0.0)),
                "artprecventa6": float(data.get("artprecventa6", 0.0)),
                "artprevendol1": float(data.get("artprevendol1", 0.0)),
                "artprevendol2": float(data.get("artprevendol2", 0.0)),
                "artprevendol3": float(data.get("artprevendol3", 0.0)),
                "artprevendol4": float(data.get("artprevendol4", 0.0)),
                "artprevendol5": float(data.get("artprevendol5", 0.0)),
                "artprevendol6": float(data.get("artprevendol6", 0.0)),
                "artpordes": float(data.get("artpordes", 0.0)),
                "artaplipro": int(data.get("artaplipro", 0)),
                "vencomision": float(data.get("vencomision", 0.0)),
                "artserie": int(data.get("artserie", 0)),
                "artseriedesp": int(data.get("artseriedesp", 0)),
                "artdiasgarven": int(data.get("artpergarantia", 0)),
                "artapliret": int(data.get("artretiene", 1)),
                "artvehiculo": int(data.get("artvehiculo", 0)),
                "artdecimal": int(data.get("artdecimales", 0)),
                "artfaccero": int(data.get("artfaccero", 0)),
                "artbloqueocompra": int(data.get("artnocompra", 0)),
                "artlote": int(data.get("artlote", 0)),
                "artvalidaN1": int(data.get("artconfirmaingreso", 0)),
                "artporvidutil": 0.0,
                "artstockporent": 0.0,
                "artimpseriecer": int(data.get("artnoimprimeseries", 0)),
                "artsincosto": int(data.get("artsincosto", 0)),
                "paiscodigo": str(data.get("paiscodigo", ""))[:3],
                "tipserie": str(data.get("arttiposerie", ""))[:1],
                "jefecodigo": str(data.get("jefecodigo", "000"))[:6],
                "sercodigo": str(data.get("sercodigo", ""))[:5],
                "calfcodigo": str(data.get("calfcodigo", ""))[:15],
                "inencodigo": str(data.get("inencodigo", ""))[:10],
                "artetiqueta": str(data.get("artetiqueta", "S"))[:3],
                "artalias": str(data.get("artalias", ""))[:300],
                "artcomentari": str(data.get("artcomentario", ""))[:100],
                "artobserva": str(data.get("artobservacion", ""))[:255],
                "artweb": str(data.get("artwebsite", ""))[:80],
                "artconcentra": str(data.get("artconcentra", ""))[:100],
                "artcantrecip": str(data.get("artcantrecip", ""))[:20],
                "artregissani": str(data.get("artregissani", ""))[:20],
                "artporpartida": float(data.get("parporcentaje", 0.0)),
                # =================================================================
                # Campos re-mapeados según indicación específica
                # =================================================================
                "artmondes": float(data.get("artvolumen", 0.0)),
                "artnumregsan": str(data.get("artancho", ""))[:20],
                "artprov4": str(data.get("artcantbulto", ""))[:15],
                "artexpins": int(data.get("artexplosion", 0)),
                "artdesporcant": int(data.get("artmodpvp", 0)),
                "refcomision": float(data.get("artfacsinstock", 0.0)),
                "artdiasgarcom": int(data.get("artapligarantia", 0)),
                "artcantcergarantia": int(data.get("artnogeneraseries", 0)),
                "artarancel": str(data.get("pardescri", ""))[:255],
                "artcodpartida": str(data.get("parcodigo", ""))[:15],
                "inendescrip": str(data.get("inendescri", ""))[:100],
                # =================================================================
                "artfecisys": fecha_pura,
                "arthorisys": hora_pura,
                "artusuisys": str(sUsuario)[:10],
                "artfecmsys": fecha_pura,
                "arthormsys": hora_pura,
                "artusumsys": str(sUsuario)[:10],
                "artfeccos": fecha_pura,
                "arthorcos": hora_pura,
                "artusucos": str(sUsuario)[:10],
                "artfecpre": fecha_pura,
                "arthorpre": hora_pura,
                "artusupre": str(sUsuario)[:10],
            }

            columnas_inmart = ", ".join(data_inmart.keys())
            valores_inmart = ", ".join([f":{key}" for key in data_inmart.keys()])
            sql_inmart = text(f"INSERT INTO inmart ({columnas_inmart}) VALUES ({valores_inmart})")

            connection.execute(sql_inmart, data_inmart)

            # =================================================================
            # D. ASIGNACIÓN A BODEGAS (SÓLO SI NO ES UN SERVICIO)
            # =================================================================
            if artservicio == 0:
                sql_get_bodegas = text(
                    """
                    SELECT bodcodigo
                    FROM inbbod WITH (NOLOCK)
                    WHERE ciacodigo = :ciacodigo AND bodstatus = 'A'
                    """
                )
                bodegas_activas = connection.execute(sql_get_bodegas, {"ciacodigo": sCodCia}).mappings().all()

                if bodegas_activas:
                    sql_stock = text(
                        """
                        INSERT INTO inmstock (
                            ciacodigo, invcodigo, artcodigo, bodcodigo, precodigo,
                            preorden, preequivale, medcodigo, prepeso, prebasica,
                            stokstatus, stokinicial, stokactual,
                            stokfecisys, stokhorisys, stokusuisys, stokfecmsys,
                            stokhormsys, stokusumsys, stokestisys, stokestmsys,
                            artpercha, stocknimimo, stockmaximo, stockdiasrep
                        ) VALUES (
                            :ciacodigo, :invcodigo, :artcodigo, :bodcodigo, :precodigo,
                            0, 0, :medcodigo, :prepeso, 0,
                            'A', 0, 0,
                            :fecisys, :horisys, :usuisys, :fecmsys,
                            :hormsys, :usumsys, :estisys, :estmsys,
                            '', :stocknimimo, :stockmaximo, 0
                        )
                        """
                    )
                    for bod in bodegas_activas:
                        data_stock = {
                            "ciacodigo": sCodCia,
                            "invcodigo": invcodigo,
                            "artcodigo": artcodigo,
                            "bodcodigo": str(bod["bodcodigo"])[:3],
                            "precodigo": precodigo,
                            "medcodigo": medcodigo,
                            "prepeso": float(data.get("artpesogm2", 0.0)),
                            "stocknimimo": float(data.get("artminimo", 0.0)),
                            "stockmaximo": float(data.get("artmaximo", 0.0)),
                            "fecisys": fecha_pura,
                            "horisys": hora_pura,
                            "usuisys": str(sUsuario)[:10],
                            "fecmsys": fecha_pura,
                            "hormsys": hora_pura,
                            "usumsys": str(sUsuario)[:10],
                            "estisys": str(sNomEst)[:50],
                            "estmsys": str(sNomEst)[:50],
                        }
                        connection.execute(sql_stock, data_stock)

            # =================================================================
            # E. INSERCIÓN DE TABLAS DETALLE (Proveedores, Barras, Sustitutos, P. Activo)
            # =================================================================

            # 1. Proveedores
            if proveedores:
                sql_prov = text(
                    """
                    INSERT INTO intartcodpro (
                        ciacodigo, invcodigo, artcodigo, procodigo, artcodigo2,
                        artfecmsys, arthormsys, artestmsys, artusumsys, artprecio
                    ) VALUES (
                        :ciacodigo, :invcodigo, :artcodigo, :procodigo, :artcodigo2,
                        :fecsys, :horsys, :estsys, :ususys, 0.0
                    )
                    """
                )
                for p in proveedores:
                    connection.execute(
                        sql_prov,
                        {
                            "ciacodigo": sCodCia,
                            "invcodigo": invcodigo,
                            "artcodigo": artcodigo,
                            "procodigo": str(p.get("provcodigo", ""))[:6],
                            "artcodigo2": str(p.get("codigoprov", ""))[:100],
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "estsys": str(sNomEst)[:40],
                            "ususys": str(sUsuario)[:10],
                        },
                    )

            # 2. Barras
            if barras:
                sql_barras = text(
                    """
                    INSERT INTO intartbarras (
                        ciacodigo, invcodigo, artcodigo, artcodbarra,
                        artfecmsys, arthormsys, artestmsys, artusumsys
                    ) VALUES (
                        :ciacodigo, :invcodigo, :artcodigo, :artcodbarra,
                        :fecsys, :horsys, :estsys, :ususys
                    )
                    """
                )
                for b in barras:
                    connection.execute(
                        sql_barras,
                        {
                            "ciacodigo": sCodCia,
                            "invcodigo": invcodigo,
                            "artcodigo": artcodigo,
                            "artcodbarra": str(b.get("codigobarra", ""))[:60],
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "estsys": str(sNomEst)[:40],
                            "ususys": str(sUsuario)[:10],
                        },
                    )

            # 3. Sustitutos
            if sustitutos:
                sql_sust = text(
                    """
                    INSERT INTO intartsustituto (
                        ciacodigo, invcodigo, artcodigo, artcodrel,
                        artsususuisys, artsusfecisys, artsushorisys, artsusestisys
                    ) VALUES (
                        :ciacodigo, :invcodigo, :artcodigo, :artcodrel,
                        :ususys, :fecsys, :horsys, :estsys
                    )
                    """
                )
                for s in sustitutos:
                    connection.execute(
                        sql_sust,
                        {
                            "ciacodigo": sCodCia,
                            "invcodigo": invcodigo,
                            "artcodigo": artcodigo,
                            "artcodrel": str(s.get("artsustituto", ""))[:15],
                            "ususys": str(sUsuario)[:10],
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "estsys": str(sNomEst)[:50],
                        },
                    )

            # 4. Principios Activos
            if principios:
                sql_prin = text(
                    """
                    INSERT INTO intartpriactivo (
                        ciacodigo, invcodigo, artcodigo, priactcodigo, priactprimario,
                        artfecmsys, arthormsys, artusumsys, artestmsys
                    ) VALUES (
                        :ciacodigo, :invcodigo, :artcodigo, :priactcodigo, :priactprimario,
                        :fecsys, :horsys, :ususys, :estsys
                    )
                    """
                )
                for pr in principios:
                    connection.execute(
                        sql_prin,
                        {
                            "ciacodigo": sCodCia,
                            "invcodigo": invcodigo,
                            "artcodigo": artcodigo,
                            "priactcodigo": str(pr.get("pricodigo", ""))[:10],
                            "priactprimario": 1 if pr.get("priprimario") else 0,
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "ususys": str(sUsuario)[:10],
                            "estsys": str(sNomEst)[:50],
                        },
                    )

            # =================================================================
            # F. INSERCIÓN DE IMÁGENES (intimagen)
            # =================================================================
            if imagenes:
                sql_imagen = text(
                    """
                    INSERT INTO intimagen (
                        ciacodigo, invcodigo, artcodigo, artsecuen, artimagen,
                        artfecmsys, arthormsys, artestmsys, artusumsys
                    ) VALUES (
                        :ciacodigo, :invcodigo, :artcodigo, :artsecuen, :artimagen,
                        :artfecmsys, :arthormsys, :artestmsys, :artusumsys
                    )
                    """
                )
                for index, img_b64 in enumerate(imagenes, start=1):
                    if "," in img_b64:
                        img_b64 = img_b64.split(",")[1]

                    imagen_bytes = base64.b64decode(img_b64)

                    data_imagen = {
                        "ciacodigo": sCodCia,
                        "invcodigo": invcodigo,
                        "artcodigo": artcodigo,
                        "artsecuen": index,
                        "artimagen": imagen_bytes,
                        "artfecmsys": fecha_pura,
                        "arthormsys": hora_pura,
                        "artestmsys": str(sNomEst)[:40],
                        "artusumsys": str(sUsuario)[:10],
                    }
                    connection.execute(sql_imagen, data_imagen)

            # =================================================================
            # G. INSERCIÓN DE DOCUMENTOS PDF (intPDF)
            # =================================================================
            if documentos_pdf:
                sql_pdf = text(
                    """
                    INSERT INTO intPDF (
                        ciacodigo, invcodigo, artcodigo, pdfsecuen, pdfimagen,
                        pdffecisys, pdfhorisys, pdfestisys, pdfusuisys,
                        pdffecmsys, pdfhormsys, pdfestmsys, pdfusumsys
                    ) VALUES (
                        :ciacodigo, :invcodigo, :artcodigo, :pdfsecuen, :pdfimagen,
                        :pdffecisys, :pdfhorisys, :pdfestisys, :pdfusuisys,
                        :pdffecmsys, :pdfhormsys, :pdfestmsys, :pdfusumsys
                    )
                    """
                )
                for index, pdf_b64 in enumerate(documentos_pdf, start=1):
                    if "," in pdf_b64:
                        pdf_b64 = pdf_b64.split(",")[1]

                    pdf_bytes = base64.b64decode(pdf_b64)

                    data_pdf = {
                        "ciacodigo": sCodCia,
                        "invcodigo": invcodigo,
                        "artcodigo": artcodigo,
                        "pdfsecuen": index,
                        "pdfimagen": pdf_bytes,
                        "pdffecisys": fecha_pura,
                        "pdfhorisys": hora_pura,
                        "pdfestisys": str(sNomEst)[:40],
                        "pdfusuisys": str(sUsuario)[:10],
                        "pdffecmsys": fecha_pura,
                        "pdfhormsys": hora_pura,
                        "pdfestmsys": str(sNomEst)[:40],
                        "pdfusumsys": str(sUsuario)[:10],
                    }
                    connection.execute(sql_pdf, data_pdf)

            # =================================================================
            # H. AUDITORÍA (inmartaud)
            # =================================================================
            sql_max_aud = text(
                """
                SELECT ISNULL(MAX(artsec), 0) AS max_sec
                FROM inmartaud WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                """
            )
            max_sec = connection.execute(
                sql_max_aud,
                {
                    "ciacodigo": sCodCia,
                    "invcodigo": invcodigo,
                    "artcodigo": artcodigo,
                },
            ).fetchone()[0]

            nueva_secuencia = max_sec + 1

            sql_auditoria = text(
                """
                INSERT INTO inmartaud (
                    ciacodigo, invcodigo, artcodigo, artnumparte, artdescri,
                    lincodigo, marcodigo, medcodigo, artpeso, precodigo,
                    artstatus, artarancel, artporpartida, artcodpartida,
                    artserie, artseriedesp, artsec,
                    artfecisys, arthorisys, artusuisys,
                    artfecmsys, arthormsys, artusumsys,
                    artsincosto, artcantcergarantia
                ) VALUES (
                    :ciacodigo, :invcodigo, :artcodigo, :artnumparte, :artdescri,
                    :lincodigo, :marcodigo, :medcodigo, :artpeso, :precodigo,
                    :artstatus, :artarancel, :artporpartida, :artcodpartida,
                    :artserie, :artseriedesp, :artsec,
                    :fecsys, :horsys, :ususys,
                    :fecsys, :horsys, :ususys,
                    :artsincosto, :artcantcergarantia
                )
                """
            )

            connection.execute(
                sql_auditoria,
                {
                    "ciacodigo": sCodCia,
                    "invcodigo": invcodigo,
                    "artcodigo": artcodigo,
                    "artnumparte": str(data.get("artnumparte", ""))[:120],
                    "artdescri": artdescri,
                    "lincodigo": lincodigo,
                    "marcodigo": marcodigo,
                    "medcodigo": medcodigo,
                    "artpeso": float(data.get("artpesogm2", 0.0)),
                    "precodigo": precodigo,
                    "artstatus": str(data.get("artstatus", "A"))[:1],
                    "artarancel": str(data.get("pardescri", ""))[:255],
                    "artporpartida": float(data.get("parporcentaje", 0.0)),
                    "artcodpartida": str(data.get("parcodigo", ""))[:15],
                    "artserie": int(data.get("artserie", 0)),
                    "artseriedesp": int(data.get("artseriedesp", 0)),
                    "artsec": nueva_secuencia,
                    "fecsys": fecha_pura,
                    "horsys": hora_pura,
                    "ususys": str(sUsuario)[:10],
                    "artsincosto": int(data.get("artsincosto", 0)),
                    "artcantcergarantia": int(data.get("artnogeneraseries", 0)),
                },
            )

    return {"data": f"Producto '{artcodigo}' creado exitosamente."}
