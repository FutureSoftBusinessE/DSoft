import base64
from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/getProductoId", methods=["POST"])
@jwt_required()
@api_endpoint
def getProductoId():
    # 1. Extracción de sesión[cite: 10]
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
        # 1. OBTENER DATOS DE LA CABECERA (inmart)[cite: 10]
        # =================================================================
        sql_cabecera = text(
            """
            SELECT
                a.*,
                ISNULL(l.lindescri, '') AS lindescri
            FROM inmart a WITH (NOLOCK)
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
                {
                    "ciacodigo": sCodCia,
                    "invcodigo": invcodigo,
                    "artcodigo": artcodigo,
                },
            )
            .mappings()
            .fetchone()
        )

        if not row:
            raise ValidationError("El producto solicitado no existe o fue eliminado.")

        # Mapeo inverso: Base de datos -> Frontend (React)[cite: 10]
        cabecera = {
            "invcodigo": str(row["invcodigo"]).strip(),
            "artcodigo": str(row["artcodigo"]).strip(),
            "artnumparte": str(row["artnumparte"] or "").strip(),
            "artdescri": str(row["artdescri"] or "").strip(),
            "artalias": str(row["artalias"] or "").strip(),
            "artetiqueta": str(row["artetiqueta"] or "S").strip(),
            "lincodigo": str(row["lincodigo"] or "").strip(),
            "lindescri": str(row["lindescri"] or "").strip(),
            "marcodigo": str(row["marcodigo"] or "").strip(),
            "medcodigo": str(row["medcodigo"] or "").strip(),
            "precodigo": str(row["precodigo"] or "").strip(),
            "jefecodigo": str(row["jefecodigo"] or "").strip(),
            "paiscodigo": str(row["paiscodigo"] or "").strip(),
            "artstatus": str(row["artstatus"] or "A").strip(),
            # Otros Datos
            "artpesogm2": float(row["artpeso"] or 0.0),
            "artcomentario": str(row["artcomentari"] or "").strip(),
            "artobservacion": str(row["artobserva"] or "").strip(),
            "artwebsite": str(row["artweb"] or "").strip(),
            "artvolumen": float(row["artmondes"] or 0.0),
            "artancho": str(row["artnumregsan"] or "").strip(),
            "artcantbulto": str(row["artprov4"] or "").strip(),
            # Parámetros booleanos y de control
            "artprodven": bool(row["artprodven"]),
            "artapliiva": bool(row["artapliiva"]),
            "artretiene": bool(row["artapliret"]),
            "artnocompra": bool(row["artbloqueocompra"]),
            "artfaccero": bool(row["artfaccero"]),
            "artservicio": bool(row["artservicio"]),
            "artexplosion": bool(row["artexpins"]),
            "artmodpvp": bool(row["artdesporcant"]),
            "artdecimales": bool(row["artdecimal"]),
            "artfacsinstock": bool(row["refcomision"]),
            "artsincosto": bool(row["artsincosto"]),
            "artminimo": float(row["artminimo"] or 0.0),
            "artmaximo": float(row["artmaximo"] or 0.0),
            "artdiasrep": int(row["artdiasrep"] or 0),
            "artdiaseg": int(row["artdiasseg"] or 0),
            "artfrecllegada": int(row["artfrelleg"] or 0),
            # Garantías y Series
            "artpergarantia": int(row["artdiasgarven"] or 0),
            "artapligarantia": bool(row["artdiasgarcom"]),
            "artnoimprimeseries": bool(row["artimpseriecer"]),
            "artnogeneraseries": bool(row["artcantcergarantia"]),
            "artserie": bool(row["artserie"]),
            "artseriedesp": bool(row["artseriedesp"]),
            "artlote": bool(row["artlote"]),
            "artconfirmaingreso": bool(row["artvalidaN1"]),
            "arttiposerie": str(row["tipserie"] or "").strip(),
            # Precios
            "artprecventa1": float(row["artprecventa1"] or 0.0),
            "artprecventa2": float(row["artprecventa2"] or 0.0),
            "artprecventa3": float(row["artprecventa3"] or 0.0),
            "artprecventa4": float(row["artprecventa4"] or 0.0),
            "artprecventa5": float(row["artprecventa5"] or 0.0),
            "artprecventa6": float(row["artprecventa6"] or 0.0),
            # Arancelario e INEN
            "inencodigo": str(row["inencodigo"] or "").strip(),
            "inendescri": str(row["inendescrip"] or "").strip(),
            "parcodigo": str(row["artcodpartida"] or "").strip(),
            "pardescri": str(row["artarancel"] or "").strip(),
            "parporcentaje": float(row["artporpartida"] or 0.0),
            "calfcodigo": str(row["calfcodigo"] or "").strip(),
            "artconcentra": str(row["artconcentra"] or "").strip(),
            "artcantrecip": str(row["artcantrecip"] or "").strip(),
            "artregissani": str(row["artregissani"] or "").strip(),
        }

        # =================================================================
        # 2. OBTENER GRILLAS SECUNDARIAS[cite: 10]
        # =================================================================
        params_grid = {
            "ciacodigo": sCodCia,
            "invcodigo": invcodigo,
            "artcodigo": artcodigo,
        }

        # A. Proveedores
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
            pass  # Ignorar si la tabla no existe en este entorno

        # B. Códigos de Barras
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

        # C. Sustitutos
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

        # D. Principios Activos
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
        # 3. OBTENER IMÁGENES Y DOCUMENTOS (BASE64)[cite: 10]
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

    # Respuesta estructurada para el frontend[cite: 10]
    return {
        "data": {
            "cabecera": cabecera,
            "proveedores": proveedores,
            "barras": barras,
            "sustitutos": sustitutos,
            "principios": principios,
            "imagenes": imagenes,
            "documentos_pdf": documentos_pdf,
        }
    }, 200
