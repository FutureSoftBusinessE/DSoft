import base64
from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateCatalogodeProductos", methods=["POST"])
@jwt_required()
@api_endpoint
def updateCatalogodeProductos():
    # 1. Extracción de sesión[cite: 9]
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    # 2. Lógica de separación de Fecha y Hora puras[cite: 9]
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # 3. Manejo de Llaves Maestras (Old -> New)[cite: 9]
    invcodigo_old = str(data.get("invcodigoOld", data.get("invcodigo", ""))).strip().upper()[:2]
    invcodigo_new = str(data.get("invcodigoNew", data.get("invcodigo", ""))).strip().upper()[:2]
    artcodigo_old = str(data.get("artcodigoOld", data.get("artcodigo", ""))).strip().upper()[:15]
    artcodigo_new = str(data.get("artcodigoNew", data.get("artcodigo", ""))).strip().upper()[:15]

    # Datos Actualizados[cite: 9]
    artdescri = str(data.get("artdescri", "")).strip().upper()[:300]
    lincodigo = str(data.get("lincodigo", "")).strip().upper()[:20]
    marcodigo = str(data.get("marcodigo", "")).strip().upper()[:5]
    medcodigo = str(data.get("medcodigo", "")).strip().upper()[:3]
    precodigo = str(data.get("precodigo", "")).strip().upper()[:2]
    artstatus = str(data.get("artstatus", "A")).strip().upper()[:1]

    # Validaciones obligatorias[cite: 9]
    if not invcodigo_old or not invcodigo_new:
        raise ValidationError("El Inventario (invcodigo) es obligatorio.")
    if not artcodigo_old or not artcodigo_new:
        raise ValidationError("El Código del Artículo es obligatorio.")
    if not artdescri:
        raise ValidationError("La Descripción del Artículo es obligatoria.")

    # Colecciones extraídas del frontend[cite: 9]
    bodegas = data.get("bodegas", [])
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
            # A. VALIDACIÓN DE INACTIVACIÓN CON STOCK (Regla de negocio VB6)[cite: 9]
            # =================================================================
            sql_stock_val = text(
                """
                SELECT
                    a.artstatus,
                    ISNULL(SUM(s.stokactual), 0) AS total_stock
                FROM inmart a WITH (NOLOCK)
                LEFT JOIN inmstock s WITH (NOLOCK)
                    ON a.ciacodigo = s.ciacodigo
                   AND a.invcodigo = s.invcodigo
                   AND a.artcodigo = s.artcodigo
                WHERE a.ciacodigo = :ciacodigo
                  AND a.invcodigo = :invcodigo_old
                  AND a.artcodigo = :artcodigo_old
                GROUP BY a.artstatus
                """
            )
            val_result = connection.execute(
                sql_stock_val,
                {
                    "ciacodigo": sCodCia,
                    "invcodigo_old": invcodigo_old,
                    "artcodigo_old": artcodigo_old,
                },
            ).fetchone()

            if not val_result:
                raise ValidationError("El artículo que intenta modificar no existe.")

            estado_actual = val_result[0]
            stock_actual = val_result[1]

            if estado_actual == "A" and artstatus == "I" and stock_actual > 0:
                raise ValidationError("No se puede inactivar un producto que tiene stock disponible.")

            # =================================================================
            # B. ACTUALIZACIÓN DE LA CABECERA (inmart)[cite: 9]
            # =================================================================
            data_inmart_update = {
                "ciacodigo": sCodCia,
                "invcodigoNew": invcodigo_new,
                "invcodigoOld": invcodigo_old,
                "artcodigoNew": artcodigo_new,
                "artcodigoOld": artcodigo_old,
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
                "artstatus": artstatus,
                "artprodven": int(data.get("artprodven", 1)),
                "artservicio": int(data.get("artservicio", 0)),
                "artapliiva": int(data.get("artapliiva", 1)),
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
                "jefecodigo": str(data.get("jefecodigo", ""))[:6],
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
                # Campos re-mapeados según indicación específica[cite: 9]
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

            # Construimos la sentencia UPDATE dinámicamente ignorando llaves PK[cite: 9]
            columnas_update = ", ".join([f"{k} = :{k}" for k in data_inmart_update.keys() if k not in ["ciacodigo", "invcodigoOld", "artcodigoOld", "invcodigoNew", "artcodigoNew"]])
            sql_inmart = text(
                f"""
                UPDATE inmart SET
                    invcodigo = :invcodigoNew,
                    artcodigo = :artcodigoNew,
                    {columnas_update}
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigoOld
                  AND artcodigo = :artcodigoOld
                """
            )

            try:
                connection.execute(sql_inmart, data_inmart_update)
            except IntegrityError:
                raise ValidationError("No se puede editar el Artículo porque el código actual está siendo usado en otros registros o transacciones.")

            # =================================================================
            # C. ACTUALIZACIÓN EN CASCADA A BODEGAS (inmstock)[cite: 9]
            # =================================================================
            sql_stock_sync = text(
                """
                UPDATE inmstock SET
                    invcodigo = :invcodigoNew,
                    artcodigo = :artcodigoNew,
                    medcodigo = :medcodigo,
                    precodigo = :precodigo,
                    stokstatus = :stokstatus,
                    stokfecmsys = :fecmsys,
                    stokhormsys = :hormsys,
                    stokusumsys = :usumsys,
                    stokestmsys = :estmsys
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigoOld
                  AND artcodigo = :artcodigoOld
                """
            )
            connection.execute(
                sql_stock_sync,
                {
                    "ciacodigo": sCodCia,
                    "invcodigoNew": invcodigo_new,
                    "artcodigoNew": artcodigo_new,
                    "invcodigoOld": invcodigo_old,
                    "artcodigoOld": artcodigo_old,
                    "medcodigo": medcodigo,
                    "precodigo": precodigo,
                    "stokstatus": artstatus,
                    "fecmsys": fecha_pura,
                    "hormsys": hora_pura,
                    "usumsys": str(sUsuario)[:10],
                    "estmsys": str(sNomEst)[:50],
                },
            )

            if bodegas:
                sql_stock_det = text(
                    """
                    UPDATE inmstock SET
                        artpercha = :artpercha,
                        stocknimimo = :stocknimimo,
                        stockmaximo = :stockmaximo
                    WHERE ciacodigo = :ciacodigo
                      AND invcodigo = :invcodigoNew
                      AND artcodigo = :artcodigoNew
                      AND bodcodigo = :bodcodigo
                    """
                )
                for bod in bodegas:
                    connection.execute(
                        sql_stock_det,
                        {
                            "ciacodigo": sCodCia,
                            "invcodigoNew": invcodigo_new,
                            "artcodigoNew": artcodigo_new,
                            "bodcodigo": str(bod.get("bodcodigo", ""))[:3],
                            "artpercha": str(bod.get("percha", ""))[:60],
                            "stocknimimo": float(bod.get("minimo", 0.0)),
                            "stockmaximo": float(bod.get("maximo", 0.0)),
                        },
                    )

            # =================================================================
            # D. REEMPLAZO DE TABLAS DETALLE (Proveedores, Barras, Sustitutos, P. Activo)[cite: 9]
            # =================================================================

            # 1. Proveedores
            connection.execute(text("DELETE FROM intartcodpro WHERE ciacodigo = :ciacodigo AND invcodigo = :invcodigoNew AND artcodigo = :artcodigoNew"), {"ciacodigo": sCodCia, "invcodigoNew": invcodigo_new, "artcodigoNew": artcodigo_new})
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
                            "invcodigo": invcodigo_new,
                            "artcodigo": artcodigo_new,
                            "procodigo": str(p.get("provcodigo", ""))[:6],
                            "artcodigo2": str(p.get("codigoprov", ""))[:100],
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "estsys": str(sNomEst)[:40],
                            "ususys": str(sUsuario)[:10],
                        },
                    )

            # 2. Barras
            connection.execute(text("DELETE FROM intartbarras WHERE ciacodigo = :ciacodigo AND invcodigo = :invcodigoNew AND artcodigo = :artcodigoNew"), {"ciacodigo": sCodCia, "invcodigoNew": invcodigo_new, "artcodigoNew": artcodigo_new})
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
                            "invcodigo": invcodigo_new,
                            "artcodigo": artcodigo_new,
                            "artcodbarra": str(b.get("codigobarra", ""))[:60],
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "estsys": str(sNomEst)[:40],
                            "ususys": str(sUsuario)[:10],
                        },
                    )

            # 3. Sustitutos
            connection.execute(text("DELETE FROM intartsustituto WHERE ciacodigo = :ciacodigo AND invcodigo = :invcodigoNew AND artcodigo = :artcodigoNew"), {"ciacodigo": sCodCia, "invcodigoNew": invcodigo_new, "artcodigoNew": artcodigo_new})
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
                            "invcodigo": invcodigo_new,
                            "artcodigo": artcodigo_new,
                            "artcodrel": str(s.get("artsustituto", ""))[:15],
                            "ususys": str(sUsuario)[:10],
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "estsys": str(sNomEst)[:50],
                        },
                    )

            # 4. Principios Activos
            connection.execute(text("DELETE FROM intartpriactivo WHERE ciacodigo = :ciacodigo AND invcodigo = :invcodigoNew AND artcodigo = :artcodigoNew"), {"ciacodigo": sCodCia, "invcodigoNew": invcodigo_new, "artcodigoNew": artcodigo_new})
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
                            "invcodigo": invcodigo_new,
                            "artcodigo": artcodigo_new,
                            "priactcodigo": str(pr.get("pricodigo", ""))[:10],
                            "priactprimario": 1 if pr.get("priprimario") else 0,
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "ususys": str(sUsuario)[:10],
                            "estsys": str(sNomEst)[:50],
                        },
                    )

            # =================================================================
            # E. REEMPLAZO DE IMÁGENES (intimagen)[cite: 9]
            # =================================================================
            sql_del_img = text(
                """
                DELETE FROM intimagen
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigoNew
                  AND artcodigo = :artcodigoNew
                """
            )
            connection.execute(
                sql_del_img,
                {
                    "ciacodigo": sCodCia,
                    "invcodigoNew": invcodigo_new,
                    "artcodigoNew": artcodigo_new,
                },
            )

            if imagenes:
                sql_ins_img = text(
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
                    connection.execute(
                        sql_ins_img,
                        {
                            "ciacodigo": sCodCia,
                            "invcodigo": invcodigo_new,
                            "artcodigo": artcodigo_new,
                            "artsecuen": index,
                            "artimagen": imagen_bytes,
                            "artfecmsys": fecha_pura,
                            "arthormsys": hora_pura,
                            "artestmsys": str(sNomEst)[:40],
                            "artusumsys": str(sUsuario)[:10],
                        },
                    )

            # =================================================================
            # F. REEMPLAZO DE DOCUMENTOS PDF (intPDF)[cite: 9]
            # =================================================================
            sql_del_pdf = text(
                """
                DELETE FROM intPDF
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigoNew
                  AND artcodigo = :artcodigoNew
                """
            )
            connection.execute(
                sql_del_pdf,
                {
                    "ciacodigo": sCodCia,
                    "invcodigoNew": invcodigo_new,
                    "artcodigoNew": artcodigo_new,
                },
            )

            if documentos_pdf:
                sql_ins_pdf = text(
                    """
                    INSERT INTO intPDF (
                        ciacodigo, invcodigo, artcodigo, pdfsecuen, pdfimagen,
                        pdffecisys, pdfhorisys, pdfestisys, pdfusuisys,
                        pdffecmsys, pdfhormsys, pdfestmsys, pdfusumsys
                    ) VALUES (
                        :ciacodigo, :invcodigo, :artcodigo, :pdfsecuen, :pdfimagen,
                        :fecsys, :horsys, :estsys, :ususys,
                        :fecsys, :horsys, :estsys, :ususys
                    )
                    """
                )
                for index, pdf_b64 in enumerate(documentos_pdf, start=1):
                    if "," in pdf_b64:
                        pdf_b64 = pdf_b64.split(",")[1]
                    pdf_bytes = base64.b64decode(pdf_b64)
                    connection.execute(
                        sql_ins_pdf,
                        {
                            "ciacodigo": sCodCia,
                            "invcodigo": invcodigo_new,
                            "artcodigo": artcodigo_new,
                            "pdfsecuen": index,
                            "pdfimagen": pdf_bytes,
                            "fecsys": fecha_pura,
                            "horsys": hora_pura,
                            "estsys": str(sNomEst)[:40],
                            "ususys": str(sUsuario)[:10],
                        },
                    )

            # =================================================================
            # G. AUDITORÍA (inmartaud)[cite: 9]
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
                    "invcodigo": invcodigo_new,
                    "artcodigo": artcodigo_new,
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
                    "invcodigo": invcodigo_new,
                    "artcodigo": artcodigo_new,
                    "artnumparte": str(data.get("artnumparte", ""))[:120],
                    "artdescri": artdescri,
                    "lincodigo": lincodigo,
                    "marcodigo": marcodigo,
                    "medcodigo": medcodigo,
                    "artpeso": float(data.get("artpesogm2", 0.0)),
                    "precodigo": precodigo,
                    "artstatus": artstatus,
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

    return {"data": f"Producto '{artcodigo_new}' actualizado y auditado exitosamente."}
