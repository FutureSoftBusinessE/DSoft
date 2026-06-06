# flake8: noqa
from flask import jsonify, request, send_file
from app.DocumentosAsociadosComponent import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
import uuid
import json
import io
from services.encrip_desencrip import encriptar, desencriptar


def null_si_vacio(valor):
    if valor is None:
        return None
    if isinstance(valor, str) and valor.strip() == "":
        return None
    return valor


# =================================================================
# 1. GET: Catálogos Globales
# =================================================================
@bp.route("/getAllTiposDocumentos", methods=["GET"])
@jwt_required()
def get_all_tipos_documentos():
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        with db.session.bind.connect() as conn:
            return jsonify({"success": True, "data": [dict(r) for r in conn.execute(text("SELECT tipdoccodigo, tipdocdescri FROM gdocbtipodoc WHERE ciacodigo = :cia AND tipdocstatus = 'A' ORDER BY tipdocdescri"), {"cia": claims["seleccion"]["cliciaciacodigo"]}).mappings().all()]}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@bp.route("/getAllInstituciones", methods=["GET"])
@jwt_required()
def get_all_instituciones():
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        with db.session.bind.connect() as conn:
            return jsonify({"success": True, "data": [dict(r) for r in conn.execute(text("SELECT insticodigo, instidescri FROM gdocbinstituciones WHERE instistatus = 'A' ORDER BY instidescri")).mappings().all()]}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@bp.route("/getAllTiposClaves", methods=["GET"])
@jwt_required()
def get_all_tipos_claves():
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        with db.session.bind.connect() as conn:
            return jsonify({"success": True, "data": [dict(r) for r in conn.execute(text("SELECT clacodigo, cladescri FROM gdocbTipoClaves WHERE clastatus = 'A' ORDER BY cladescri")).mappings().all()]}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 2. GET: getDocumentosAsociados
# =================================================================
@bp.route("/getDocumentosAsociados/<string:qgenero>/<string:procqgenero>", methods=["GET"])
@jwt_required()
def get_documentos_asociados(qgenero, procqgenero):
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        with db.session.bind.connect() as connection:
            query = text(
                """
                SELECT d.documentouuid, d.docnombre, d.docextension, d.docfecemi, d.docfecven,
                       d.docindex1, d.docindex2, d.docindex3, d.docindex4, d.docindex5, d.docindex6,
                       d.docfechorisys, d.docusuisys, d.insticodigo, d.clacodigo, i.instidescri
                FROM gdocmdocumentos d
                LEFT JOIN gdocbinstituciones i ON d.insticodigo = i.insticodigo
                WHERE d.ciacodigo = :ciacodigo AND d.docqgenero = :qgenero AND d.docprocqgenero = :procqgenero AND d.docestisys = 'A'
                ORDER BY d.docfechorisys DESC
            """
            )
            result = connection.execute(query, {"ciacodigo": claims["seleccion"]["cliciaciacodigo"], "qgenero": qgenero, "procqgenero": procqgenero}).mappings().all()
            data = []
            for row in result:
                r = dict(row)
                if r["docfecemi"]:
                    r["docfecemi"] = str(r["docfecemi"])
                if r["docfecven"]:
                    r["docfecven"] = str(r["docfecven"])
                if r["docfechorisys"]:
                    r["docfechorisys"] = r["docfechorisys"].strftime("%Y-%m-%d %H:%M:%S")
                data.append(r)
            return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 3. POST: guardarArchivoAdjunto (BLINDADO CON HEXADECIMAL)
# =================================================================
@bp.route("/guardarArchivoAdjunto", methods=["POST"])
@jwt_required()
def upload_documento():
    try:
        claims = get_jwt()
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usuario = claims.get("usuario", {}).get("usucodigo", "SISTEMA")
        db.session = get_session(claims["seleccion"]["clicianonBD"])

        docqgenero = request.form.get("docqgenero")
        docprocqgenero = request.form.get("docprocqgenero")
        docsecuen = request.form.get("docsecuen")

        if not all([docqgenero, docprocqgenero, docsecuen]) or docqgenero == "undefined":
            return jsonify({"success": False, "message": "Faltan parámetros obligatorios"}), 400

        file = request.files.get("file")
        documento_bytes = None
        doc_datos_sensibles = None

        if file and file.filename != "":
            documento_bytes = file.read()
            docnombre = file.filename
            docextension = docnombre.rsplit(".", 1)[1].lower() if "." in docnombre else ""
            if docextension in ["p12", "pfx"]:
                password_p12 = request.form.get("password_p12")
                if password_p12:
                    doc_datos_sensibles = encriptar(json.dumps({"clave_certificado": password_p12})).encode("utf-8")
        else:
            docextension = "clv"
            docnombre = request.form.get("docnombre", "Credencial de Seguridad")
            payload_seguridad = {
                "url": request.form.get("url", ""),
                "email": request.form.get("email", ""),
                "usuario": request.form.get("usuario", ""),
                "clave": request.form.get("clave", ""),
                "preguntas": [{"pregunta": request.form.get(f"q{x}", ""), "respuesta": request.form.get(f"r{x}", "")} for x in range(1, 5)],
            }
            doc_datos_sensibles = encriptar(json.dumps(payload_seguridad)).encode("utf-8")

        new_uuid = str(uuid.uuid4())

        # --- SOLUCIÓN: CONVERTIMOS A HEXADECIMAL PARA NO PERDER DATOS NI CORROMPER JSON ---
        doc_hex = documento_bytes.hex() if documento_bytes else None
        sens_hex = doc_datos_sensibles.hex() if doc_datos_sensibles else None

        with db.session.bind.connect() as connection:
            with connection.begin():
                query = text(
                    """
                    INSERT INTO gdocmdocumentos (
                        ciacodigo, documentouuid, docextension, docqgenero, docprocqgenero, docsecuen, docnombre, documento, doc_datos_sensibles,
                        docfecemi, docfecven, docindex1, docindex2, docindex3, docindex4, docindex5, docindex6, insticodigo, clacodigo, docfechorisys, docusuisys, docestisys
                    ) VALUES (
                        :ciacodigo, :documentouuid, :docextension, :docqgenero, :docprocqgenero, :docsecuen, :docnombre,
                        CASE WHEN :doc_hex IS NOT NULL THEN CONVERT(VARBINARY(MAX), :doc_hex, 2) ELSE NULL END,
                        CASE WHEN :sens_hex IS NOT NULL THEN CONVERT(VARBINARY(MAX), :sens_hex, 2) ELSE NULL END,
                        :docfecemi, :docfecven, :docindex1, :docindex2, :docindex3, :docindex4, :docindex5, :docindex6, :insticodigo, :clacodigo, :docfechorisys, :docusuisys, 'A'
                    )
                """
                )
                connection.execute(
                    query,
                    {
                        "ciacodigo": ciacodigo,
                        "documentouuid": new_uuid,
                        "docextension": docextension,
                        "docqgenero": docqgenero,
                        "docprocqgenero": docprocqgenero,
                        "docsecuen": docsecuen,
                        "docnombre": docnombre,
                        "doc_hex": doc_hex,
                        "sens_hex": sens_hex,
                        "docfecemi": null_si_vacio(request.form.get("docfecemi")),
                        "docfecven": null_si_vacio(request.form.get("docfecven")),
                        "docindex1": null_si_vacio(request.form.get("docindex1")),
                        "docindex2": null_si_vacio(request.form.get("docindex2")),
                        "docindex3": null_si_vacio(request.form.get("docindex3")),
                        "docindex4": null_si_vacio(request.form.get("docindex4")),
                        "docindex5": null_si_vacio(request.form.get("docindex5")),
                        "docindex6": null_si_vacio(request.form.get("docindex6")),
                        "insticodigo": null_si_vacio(request.form.get("insticodigo")),
                        "clacodigo": null_si_vacio(request.form.get("clacodigo")),
                        "docfechorisys": datetime.now(),
                        "docusuisys": usuario,
                    },
                )
        return jsonify({"success": True, "message": "Documento guardado correctamente", "documentouuid": new_uuid}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 4. GET: getDatosSensibles (CON RESCATE DE JSON Y PROTECCIÓN DE ERROR 500)
# =================================================================
@bp.route("/getDatosSensibles/<string:documentouuid>", methods=["GET"])
@jwt_required()
def get_datos_sensibles(documentouuid):
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        with db.session.bind.connect() as connection:
            query = text(
                """
                SELECT d.docextension, COALESCE(d.doc_datos_sensibles, o.doc_datos_sensibles)
                FROM gdocmdocumentos d
                LEFT JOIN gdocmdocumentos o ON d.documento_origen_uuid = o.documentouuid
                WHERE d.documentouuid = :uuid AND d.ciacodigo = :ciacodigo
            """
            )
            result = connection.execute(query, {"uuid": documentouuid, "ciacodigo": claims["seleccion"]["cliciaciacodigo"]}).first()

            if not result or not result[1]:
                return jsonify({"success": False, "message": "Datos no encontrados"}), 404

            # Desencriptación
            contenido_json_string = desencriptar(result[1].decode("utf-8")).strip()

            # Limpieza de padding
            while contenido_json_string and ord(contenido_json_string[-1]) < 32:
                contenido_json_string = contenido_json_string[:-1]

            # --- RESTAURACIÓN DEL FALLBACK ---
            # Atrapamos la excepción de JSON para que NO lance 500 y llegue al Front para autorrepararse
            try:
                datos_obj = json.loads(contenido_json_string)
            except Exception:
                datos_obj = {"usuario": contenido_json_string, "clave": "", "url": "", "email": "", "preguntas": []}

            return jsonify({"success": True, "docextension": result[0], "data": datos_obj}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 5. GET: downloadDocumento (DESCARGA BINARIA PURA)
# =================================================================
@bp.route("/downloadDocumento/<string:documentouuid>", methods=["GET"])
@jwt_required()
def download_documento(documentouuid):
    try:
        import io
        from flask import send_file

        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        with db.session.bind.connect() as connection:
            query = text(
                """
                SELECT COALESCE(d.documento, o.documento), d.docnombre, d.docextension
                FROM gdocmdocumentos d
                LEFT JOIN gdocmdocumentos o ON d.documento_origen_uuid = o.documentouuid
                WHERE d.documentouuid = :uuid AND d.ciacodigo = :ciacodigo
            """
            )
            result = connection.execute(query, {"uuid": documentouuid, "ciacodigo": claims["seleccion"]["cliciaciacodigo"]}).first()
            if not result or not result[0]:
                return jsonify({"success": False, "message": "Archivo físico no encontrado"}), 404

            # Formateo estricto del buffer (Misma técnica de FirmarPDFDF)
            out_stream = io.BytesIO(result[0])
            out_stream.seek(0)

            return send_file(out_stream, mimetype="application/octet-stream", as_attachment=True, download_name=result[1])  # Fuerza la descarga binaria genérica
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 6. DELETE: deleteDocumento
# =================================================================
@bp.route("/deleteDocumento/<string:documentouuid>", methods=["DELETE"])
@jwt_required()
def delete_documento(documentouuid):
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        with db.session.bind.connect() as connection:
            with connection.begin():
                connection.execute(
                    text("UPDATE gdocmdocumentos SET docestisys = 'I', docfechorisys = :f, docusuisys = :u WHERE documentouuid = :uuid AND ciacodigo = :cia"),
                    {"f": datetime.now(), "u": claims.get("usuario", {}).get("usucodigo", "SISTEMA"), "uuid": documentouuid, "cia": claims["seleccion"]["cliciaciacodigo"]},
                )
        return jsonify({"success": True, "message": "Documento inactivado"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 7. POST: buscarDocumentosParaImportar
# =================================================================
@bp.route("/buscarDocumentosParaImportar", methods=["POST"])
@jwt_required()
def buscar_documentos_para_importar():
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        filtros = request.json or {}

        sql = """
            SELECT d.documentouuid, d.docnombre, d.docextension, d.docqgenero, d.docprocqgenero, d.docfecemi, d.docfecven, d.docindex1, i.instidescri
            FROM gdocmdocumentos d
            LEFT JOIN gdocbinstituciones i ON d.insticodigo = i.insticodigo
            WHERE d.ciacodigo = :cia AND d.docestisys = 'A' AND d.documento_origen_uuid IS NULL
        """
        params = {"cia": claims["seleccion"]["cliciaciacodigo"]}

        for campo in ["docextension", "docqgenero", "docnombre", "docindex1"]:
            if filtros.get(campo):
                sql += f" AND d.{campo} LIKE :{campo}"
                params[campo] = f"%{filtros[campo]}%"
        for campo in ["docfecemi", "docfecven"]:
            if filtros.get(campo):
                sql += f" AND d.{campo} = :{campo}"
                params[campo] = filtros[campo]
        for num in range(2, 7):
            if filtros.get(f"docindex{num}"):
                sql += f" AND d.docindex{num} = :docindex{num}"
                params[f"docindex{num}"] = filtros[f"docindex{num}"]

        with db.session.bind.connect() as conn:
            result = conn.execute(text(sql), params).mappings().all()
            data = []
            for row in result:
                r = dict(row)
                if r["docfecemi"]:
                    r["docfecemi"] = str(r["docfecemi"])
                if r["docfecven"]:
                    r["docfecven"] = str(r["docfecven"])
                data.append(r)
            return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =================================================================
# 8. POST: ejecutarImportacionDocumento (CORREGIDO TRANSACTION)
# =================================================================
@bp.route("/ejecutarImportacionDocumento", methods=["POST"])
@jwt_required()
def ejecutar_importacion_documento():
    try:
        claims = get_jwt()
        db.session = get_session(claims["seleccion"]["clicianonBD"])
        body = request.json or {}
        orig_uuid = body.get("documentouuid_origen")
        nuevo_q = body.get("docqgenero")
        nuevo_proc = body.get("docprocqgenero")
        nuevo_sec = body.get("docsecuen")

        if not all([orig_uuid, nuevo_q, nuevo_proc, nuevo_sec]):
            return jsonify({"success": False, "message": "Faltan parámetros de indexación para importar"}), 400

        with db.session.bind.connect() as conn:
            # --- CORRECCIÓN: El bloque 'begin()' debe envolver tanto al SELECT como al INSERT ---
            with conn.begin():
                orig = conn.execute(text("SELECT docextension, docnombre, docfecemi, docfecven, docindex1, docindex2, docindex3, docindex4, docindex5, docindex6, insticodigo, clacodigo FROM gdocmdocumentos WHERE documentouuid = :u"), {"u": orig_uuid}).first()
                if not orig:
                    return jsonify({"success": False, "message": "Documento original no existe"}), 404

                new_uuid = str(uuid.uuid4())
                sql_ins = text(
                    """
                    INSERT INTO gdocmdocumentos (
                        ciacodigo, documentouuid, docextension, docqgenero, docprocqgenero, docsecuen, docnombre, documento, doc_datos_sensibles,
                        docfecemi, docfecven, docindex1, docindex2, docindex3, docindex4, docindex5, docindex6, insticodigo, clacodigo, docfechorisys, docusuisys, docestisys, documento_origen_uuid
                    ) VALUES (
                        :cia, :uuid, :ext, :q, :proc, :sec, :nom, NULL, NULL, :femi, :fven, :idx1, :idx2, :idx3, :idx4, :idx5, :idx6, :inst, :cla, :fec, :usr, 'A', :orig
                    )
                """
                )

                conn.execute(
                    sql_ins,
                    {
                        "cia": claims["seleccion"]["cliciaciacodigo"],
                        "uuid": new_uuid,
                        "ext": orig[0],
                        "q": nuevo_q,
                        "proc": nuevo_proc,
                        "sec": nuevo_sec,
                        "nom": orig[1],
                        "femi": orig[2],
                        "fven": orig[3],
                        "idx1": orig[4],
                        "idx2": orig[5],
                        "idx3": orig[6],
                        "idx4": orig[7],
                        "idx5": orig[8],
                        "idx6": orig[9],
                        "inst": orig[10],
                        "cla": orig[11],
                        "fec": datetime.now(),
                        "usr": claims.get("usuario", {}).get("usucodigo", "SISTEMA"),
                        "orig": orig_uuid,
                    },
                )

        return jsonify({"success": True, "message": "Documento importado con éxito por puntero de herencia", "documentouuid": new_uuid}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
