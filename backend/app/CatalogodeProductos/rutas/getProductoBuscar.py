import base64
from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/getProductoBuscar", methods=["POST"])
@jwt_required()
@api_endpoint
def getProductoBuscar():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json() or {}
    invcodigo = str(data.get("invcodigo", "")).strip()
    artcodigo = str(data.get("artcodigo", "")).strip()

    if not invcodigo or not artcodigo:
        raise ValidationError("Se requiere el Inventario y el Código del Artículo.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # =================================================================
        # 1. OBTENER DATOS DE LA CABECERA (view_inmart)
        # =================================================================
        sql_cabecera = text(
            """
            SELECT
                a.*,
                ISNULL(l.lindescri, '') AS lindescri
            FROM view_inmart a WITH (NOLOCK)
            LEFT JOIN inblin l WITH (NOLOCK)
                   ON a.ciacodigo = l.ciacodigo AND a.lincodigo = l.lincodigo
            WHERE a.ciacodigo = :ciacodigo
              AND a.invcodigo = :invcodigo
              AND a.artcodigo = :artcodigo
            """
        )
        row = (
            connection.execute(
                sql_cabecera,
                {"ciacodigo": sCodCia, "invcodigo": invcodigo, "artcodigo": artcodigo},
            )
            .mappings()
            .fetchone()
        )

        if not row:
            raise ValidationError("El producto solicitado no existe o fue eliminado.")

        # =================================================================
        # 2. OBTENER CIF y FOB (ufn_inv_ultimo_cif_fob)
        # =================================================================
        cif_val = 0.0
        fob_val = 0.0
        try:
            sql_cif_fob = text("SELECT * FROM dbo.ufn_inv_ultimo_cif_fob(:ciacodigo, :invcodigo, :artcodigo)")
            row_cf = (
                connection.execute(
                    sql_cif_fob,
                    {
                        "ciacodigo": sCodCia,
                        "invcodigo": invcodigo,
                        "artcodigo": artcodigo,
                    },
                )
                .mappings()
                .fetchone()
            )
            if row_cf:
                cif_val = float(row_cf.get("CIF", 0.0) or 0.0)
                fob_val = float(row_cf.get("fob", 0.0) or 0.0)
        except Exception:
            pass  # Ignorar si la función no existe o falla

        cabecera = {
            "invcodigo": str(row["invcodigo"]).strip(),
            "artcodigo": str(row["artcodigo"]).strip(),
            "artnumparte": str(row["artnumparte"] or "").strip(),
            "artdescri": str(row["artdescri"] or "").strip(),
            "artalias": str(row["artalias"] or "").strip(),
            "artetiqueta": str(row.get("artetiqueta", "S")).strip(),
            "lincodigo": str(row["lincodigo"] or "").strip(),
            "lindescri": str(row["lindescri"] or "").strip(),
            "marcodigo": str(row["marcodigo"] or "").strip(),
            "medcodigo": str(row["medcodigo"] or "").strip(),
            "precodigo": str(row["precodigo"] or "").strip(),
            "jefecodigo": str(row.get("jefecodigo", "") or "").strip(),
            "paiscodigo": str(row.get("paiscodigo", "") or "").strip(),
            "artstatus": str(row["artstatus"] or "A").strip(),
            # Cantidades
            "artcantinicial": float(row.get("ArtCantInicial", 0.0) or 0.0),
            "artcantactual": float(row.get("artcantactual", 0.0) or 0.0),
            "artcanttranfer": float(row.get("Artcanttranfer", 0.0) or 0.0),
            "artcantimporta": float(row.get("Artcantimporta", 0.0) or 0.0),
            # Costos
            "artcostoinidol": float(row.get("ArtCostoInidol", 0.0) or 0.0),
            "artcostoactdol": float(row.get("artcostoactdol", 0.0) or 0.0),
            "cif": cif_val,
            "fob": fob_val,
            "artpesogm2": float(row["artpeso"] or 0.0),
            "artcomentario": str(row.get("artcomentari", "") or "").strip(),
            "artobservacion": str(row.get("artobserva", "") or "").strip(),
            "artwebsite": str(row.get("artweb", "") or "").strip(),
            "artvolumen": float(row.get("artmondes", 0.0) or 0.0),
            "artancho": str(row.get("artnumregsan", "") or "").strip(),
            "artcantbulto": str(row.get("artprov4", "") or "").strip(),
            "artprodven": bool(row["artprodven"]),
            "artapliiva": bool(row["artapliiva"]),
            "artretiene": bool(row.get("artapliret", False)),
            "artnocompra": bool(row.get("artbloqueocompra", False)),
            "artfaccero": bool(row["artfaccero"]),
            "artservicio": bool(row["artservicio"]),
            "artexplosion": bool(row.get("artexpins", False)),
            "artmodpvp": bool(row.get("artdesporcant", False)),
            "artdecimales": bool(row["artdecimal"]),
            "artfacsinstock": bool(row.get("refcomision", False)),
            "artsincosto": bool(row["artsincosto"]),
            "artminimo": float(row["artminimo"] or 0.0),
            "artmaximo": float(row["artmaximo"] or 0.0),
            "artdiasrep": int(row["artdiasrep"] or 0),
            "artdiaseg": int(row.get("artdiasseg", 0) or 0),
            "artfrecllegada": int(row.get("artfrelleg", 0) or 0),
            "artpergarantia": int(row.get("artdiasgarven", 0) or 0),
            "artapligarantia": bool(row.get("artdiasgarcom", False)),
            "artnoimprimeseries": bool(row.get("artimpseriecer", False)),
            "artnogeneraseries": bool(row.get("artcantcergarantia", False)),
            "artserie": bool(row["artserie"]),
            "artseriedesp": bool(row["artseriedesp"]),
            "artlote": bool(row["artlote"]),
            "artconfirmaingreso": bool(row.get("artvalidaN1", False)),
            "arttiposerie": str(row.get("tipserie", "") or "").strip(),
            "artprecventa1": float(row["artprecventa1"] or 0.0),
            "artprecventa2": float(row["artprecventa2"] or 0.0),
            "artprecventa3": float(row["artprecventa3"] or 0.0),
            "artprecventa4": float(row["artprecventa4"] or 0.0),
            "artprecventa5": float(row["artprecventa5"] or 0.0),
            "artprecventa6": float(row["artprecventa6"] or 0.0),
            "inencodigo": str(row.get("inencodigo", "") or "").strip(),
            "inendescri": str(row.get("inendescrip", "") or "").strip(),
            "parcodigo": str(row.get("artcodpartida", "") or "").strip(),
            "pardescri": str(row.get("artarancel", "") or "").strip(),
            "parporcentaje": float(row.get("artporpartida", 0.0) or 0.0),
            "calfcodigo": str(row.get("calfcodigo", "") or "").strip(),
            "artconcentra": str(row.get("artconcentra", "") or "").strip(),
            "artcantrecip": str(row.get("artcantrecip", "") or "").strip(),
            "artregissani": str(row.get("artregissani", "") or "").strip(),
        }

        # =================================================================
        # 3. OBTENER GRILLAS SECUNDARIAS
        # =================================================================
        params_grid = {
            "ciacodigo": sCodCia,
            "invcodigo": invcodigo,
            "artcodigo": artcodigo,
        }

        proveedores = []
        try:
            sql_prov = text(
                """
                SELECT procodigo, artcodigo2
                FROM intartcodpro WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                """
            )
            res_prov = connection.execute(sql_prov, params_grid).mappings().all()
            for idx, p in enumerate(res_prov):
                proveedores.append(
                    {
                        "id": idx + 1,
                        "provcodigo": str(p["procodigo"]).strip(),
                        "codigoprov": str(p["artcodigo2"]).strip(),
                    }
                )
        except Exception:
            pass

        barras = []
        try:
            sql_barras = text(
                """
                SELECT artcodbarra
                FROM intartbarras WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                """
            )
            res_barras = connection.execute(sql_barras, params_grid).mappings().all()
            for idx, b in enumerate(res_barras):
                barras.append(
                    {
                        "id": idx + 1,
                        "codigobarra": str(b["artcodbarra"]).strip(),
                    }
                )
        except Exception:
            pass

        sustitutos = []
        try:
            sql_sust = text(
                """
                SELECT artcodrel
                FROM intartsustituto WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                """
            )
            res_sust = connection.execute(sql_sust, params_grid).mappings().all()
            for idx, s in enumerate(res_sust):
                sustitutos.append(
                    {
                        "id": idx + 1,
                        "artsustituto": str(s["artcodrel"]).strip(),
                    }
                )
        except Exception:
            pass

        principios = []
        try:
            sql_prin = text(
                """
                SELECT priactcodigo, priactprimario
                FROM intartpriactivo WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                """
            )
            res_prin = connection.execute(sql_prin, params_grid).mappings().all()
            for idx, pr in enumerate(res_prin):
                principios.append(
                    {
                        "id": idx + 1,
                        "pricodigo": str(pr["priactcodigo"]).strip(),
                        "priprimario": bool(pr["priactprimario"]),
                    }
                )
        except Exception:
            pass

        # =================================================================
        # 4. OBTENER IMÁGENES Y DOCUMENTOS (BASE64)
        # =================================================================
        imagenes = []
        sql_img = text(
            """
            SELECT artsecuen, artimagen
            FROM intimagen WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
              AND invcodigo = :invcodigo
              AND artcodigo = :artcodigo
            ORDER BY artsecuen
            """
        )
        res_img = connection.execute(sql_img, params_grid).mappings().all()
        for img in res_img:
            if img["artimagen"]:
                b64 = base64.b64encode(img["artimagen"]).decode("utf-8")
                imagenes.append(
                    {
                        "id": img["artsecuen"],
                        "base64": f"data:image/jpeg;base64,{b64}",
                    }
                )

        documentos_pdf = []
        sql_pdf = text(
            """
            SELECT pdfsecuen, pdfimagen
            FROM intPDF WITH (NOLOCK)
            WHERE ciacodigo = :ciacodigo
              AND invcodigo = :invcodigo
              AND artcodigo = :artcodigo
            ORDER BY pdfsecuen
            """
        )
        res_pdf = connection.execute(sql_pdf, params_grid).mappings().all()
        for pdf in res_pdf:
            if pdf["pdfimagen"]:
                b64 = base64.b64encode(pdf["pdfimagen"]).decode("utf-8")
                documentos_pdf.append(
                    {
                        "id": pdf["pdfsecuen"],
                        "nombre": f"Documento_{pdf['pdfsecuen']}.pdf",
                        "base64": f"data:application/pdf;base64,{b64}",
                    }
                )

        # =================================================================
        # 5. OBTENER HISTORIAL DE AUDITORÍA (view_inmartaud)
        # =================================================================
        auditoria = []
        try:
            sql_aud = text(
                """
                SELECT LEFT(CAST(arthormsys as time),8) as arthorsys, *
                FROM view_inmartaud WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                ORDER BY artsec
                """
            )
            res_aud = connection.execute(sql_aud, params_grid).mappings().all()

            for idx, a in enumerate(res_aud):
                auditoria.append(
                    {
                        "id": idx + 1,
                        "artfecmsys": (a["artfecmsys"].strftime("%Y-%m-%d") if a["artfecmsys"] else ""),
                        "arthorsys": str(a["arthorsys"]) if a["arthorsys"] else "",
                        "artusumsys": str(a["artusumsys"] or ""),
                        "ciacodigo": str(a["ciacodigo"] or ""),
                        "invcodigo": str(a["invcodigo"] or ""),
                        "artcodigo": str(a["artcodigo"] or ""),
                        "artdescri": str(a["artdescri"] or ""),
                        "artnumparte": str(a["artnumparte"] or ""),
                        "lincodigo": str(a["lincodigo"] or ""),
                        "lindescri": str(a.get("lindescri", "") or ""),
                        "mardescri": str(a.get("MarDescri", "") or ""),
                        "meddescri": str(a.get("MedDescri", "") or ""),
                        "artpeso": str(a["artpeso"] or ""),
                        "predescri": str(a.get("predescri", "") or ""),
                        "artserie": "SI" if a["artserie"] else "NO",
                        "artseriedesp": "SI" if a["artseriedesp"] else "NO",
                        "artcodpartida": str(a["artcodpartida"] or ""),
                        "artarancel": str(a["artarancel"] or ""),
                        "artporpartida": str(a["artporpartida"] or ""),
                        "artsincosto": "SI" if a["artsincosto"] else "NO",
                        "artcantcergarantia": ("SI" if a["artcantcergarantia"] else "NO"),
                    }
                )
        except Exception:
            pass

    return {
        "data": {
            "cabecera": cabecera,
            "proveedores": proveedores,
            "barras": barras,
            "sustitutos": sustitutos,
            "principios": principios,
            "imagenes": imagenes,
            "documentos_pdf": documentos_pdf,
            "auditoria": auditoria,
        }
    }, 200
