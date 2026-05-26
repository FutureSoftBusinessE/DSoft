from flask import jsonify, request
from app.DocumentosAsociadosComponent import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
import uuid
from services.encrip_desencrip import encriptar, desencriptar


def null_si_vacio(valor):
    if valor is None:
        return None
    if isinstance(valor, str) and valor.strip() == "":
        return None
    return valor


# =================================================================
# 1. GET: getAllTiposDocumentos
# =================================================================


@bp.route("/getAllTiposDocumentos", methods=["GET"])
@cross_origin()
@jwt_required()
def get_all_tipos_documentos():
    """
    Obtiene todos los tipos de documentos activos de la tabla gdocbtipodoc
    PARA TODOS LOS COMBOBOXES (docindex1-5)
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            query = text(
                """
                SELECT
                    tipdoccodigo,
                    tipdocdescri
                FROM gdocbtipodoc
                WHERE ciacodigo = :ciacodigo
                    AND tipdocstatus = 'A'
                ORDER BY tipdocdescri
            """
            )

            result = connection.execute(query, {"ciacodigo": ciacodigo})
            tipos_documentos = [dict(row) for row in result.mappings()]

            # Formatear para el CustomAutocomplete
            tipos_formateados = []
            for tipo in tipos_documentos:
                tipos_formateados.append({"tipdoccodigo": tipo["tipdoccodigo"], "tipdocdescri": tipo["tipdocdescri"], "value": tipo["tipdoccodigo"], "label": tipo["tipdocdescri"]})

            return jsonify({"success": True, "message": "Tipos de documentos obtenidos exitosamente", "data": tipos_formateados}), 200

    except Exception as e:
        print(f"Error en getAllTiposDocumentos: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al obtener tipos de documentos: {str(e)}"}}), 500


# =================================================================
# 2. POST: getAllDocumentosAsociados
# =================================================================


@bp.route("/getAllDocumentosAsociados", methods=["POST"])
@cross_origin()
@jwt_required()
def get_all_documentos_asociados():
    """
    Obtiene todos los documentos asociados a una entidad específica
    CON LOS JOINS PARA CADA docindex
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        # Parsear datos JSON del request
        data = request.get_json()
        docqgenero = data.get("docqgenero")
        docprocqgenero = data.get("docprocqgenero")

        # Validar datos requeridos
        if not docqgenero or not docprocqgenero:
            return jsonify({"error": {"success": False, "message": "docqgenero y docprocqgenero son requeridos"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            query = text(
                """
                SELECT
                    d.documentouuid,
                    d.docsecuen,
                    d.docnombre,
                    d.docextension,
                    d.docfecemi,
                    d.docfecven,
                    -- docindex1 con descripción
                    d.docindex1,
                    t1.tipdocdescri as docindex1_descri,
                    -- docindex2 con descripción
                    d.docindex2,
                    t2.tipdocdescri as docindex2_descri,
                    -- docindex3 con descripción
                    d.docindex3,
                    t3.tipdocdescri as docindex3_descri,
                    -- docindex4 con descripción
                    d.docindex4,
                    t4.tipdocdescri as docindex4_descri,
                    -- docindex5 con descripción
                    d.docindex5,
                    t5.tipdocdescri as docindex5_descri,
                    -- docindex6 (texto libre)
                    d.docindex6,
                    -- Campos de auditoría
                    d.docfechorisys,
                    d.docusuisys,
                    d.docestisys,
                    d.docqgenero,
                    d.docprocqgenero,
                    d.documento_origen_uuid
                FROM gdocmdocumentos d
                -- LEFT JOIN para cada docindex
                LEFT JOIN gdocbtipodoc t1 ON d.ciacodigo = t1.ciacodigo
                    AND d.docindex1 = t1.tipdoccodigo
                LEFT JOIN gdocbtipodoc t2 ON d.ciacodigo = t2.ciacodigo
                    AND d.docindex2 = t2.tipdoccodigo
                LEFT JOIN gdocbtipodoc t3 ON d.ciacodigo = t3.ciacodigo
                    AND d.docindex3 = t3.tipdoccodigo
                LEFT JOIN gdocbtipodoc t4 ON d.ciacodigo = t4.ciacodigo
                    AND d.docindex4 = t4.tipdoccodigo
                LEFT JOIN gdocbtipodoc t5 ON d.ciacodigo = t5.ciacodigo
                    AND d.docindex5 = t5.tipdoccodigo
                WHERE d.ciacodigo = :ciacodigo
                    AND d.docqgenero = :docqgenero
                    AND d.docprocqgenero = :docprocqgenero
                ORDER BY d.docsecuen
            """
            )

            result = connection.execute(query, {"ciacodigo": ciacodigo, "docqgenero": docqgenero, "docprocqgenero": docprocqgenero})

            documentos = [dict(row) for row in result.mappings()]

            # Formatear UUID y fechas
            for doc in documentos:
                # Convertir UUID a string
                if doc.get("documentouuid"):
                    doc["documentouuid"] = str(doc["documentouuid"])

                # Formatear fechas
                for fecha_field in ["docfecemi", "docfecven", "docfechorisys"]:
                    if doc.get(fecha_field):
                        doc[fecha_field] = doc[fecha_field].isoformat() if hasattr(doc[fecha_field], "isoformat") else str(doc[fecha_field])

                # Para compatibilidad con frontend existente
                doc["tipdoccodigo"] = doc.get("docindex3", "")
                doc["tipdocdescri"] = doc.get("docindex3_descri", "")

            return jsonify({"success": True, "message": "Documentos obtenidos exitosamente", "data": documentos}), 200

    except Exception as e:
        print(f"Error en getAllDocumentosAsociados: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al obtener documentos: {str(e)}"}}), 500


# =================================================================
# 3. POST: createNewDocumento
# =================================================================


@bp.route("/createNewDocumento", methods=["POST"])
@cross_origin()
@jwt_required()
def create_new_documento():
    """
    Crea un nuevo documento en la tabla gdocmdocumentos
    CON NUEVA ESTRUCTURA (docindex1-6)
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usuario_actual = claims["user"]
        estacion_actual = request.headers.get("X-Forwarded-For", request.remote_addr)

        # Obtener archivo del FormData
        archivo = request.files.get("archivo")

        if not archivo:
            return jsonify({"error": {"success": False, "message": "No se recibió ningún archivo"}}), 400

        nombre_archivo = archivo.filename
        extension = nombre_archivo.split(".")[-1].lower() if "." in nombre_archivo else ""

        # ============================================
        # DETECTAR SI ES CLAVE POR LA EXTENSIÓN .clv
        # ============================================
        es_clave = extension == "clv"

        # Leer el archivo según el tipo
        if es_clave:
            contenido_texto = archivo.read().decode("utf-8")
            string_encriptado = encriptar(contenido_texto)  # usuario;clave;url(opcional)
            archivo_binario = string_encriptado.encode("utf-8")
        else:
            archivo_binario = archivo.read()

        # Obtener datos del formulario
        form_data = request.form.to_dict()

        # Validar datos requeridos
        docqgenero = form_data.get("docqgenero")
        docprocqgenero = form_data.get("docprocqgenero")
        docindex6 = form_data.get("docindex6")  # Campo obligatorio

        if not docqgenero or not docprocqgenero:
            return jsonify({"error": {"success": False, "message": "docqgenero y docprocqgenero son requeridos"}}), 400

        # Validar que docindex6 sea obligatorio
        if not docindex6 or not docindex6.strip():
            return jsonify({"error": {"success": False, "message": "Etiqueta 6 (Texto libre obligatorio) es requerida"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        # Obtener la fecha actual con la hora seteada en 00:00:00
        fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        with engine.connect() as connection:
            with connection.begin():
                # ============================================
                # 1. VALIDAR QUE LOS docindex1-5 EXISTAN EN gdocbtipodoc (si tienen valor)
                # ============================================
                docindex_fields = ["docindex1", "docindex2", "docindex3", "docindex4", "docindex5"]

                for field in docindex_fields:
                    field_value = form_data.get(field)
                    if field_value:  # Solo validar si tiene valor
                        query_tipo = text(
                            """
                            SELECT tipdoccodigo
                            FROM gdocbtipodoc
                            WHERE ciacodigo = :ciacodigo
                                AND tipdoccodigo = :tipdoccodigo
                                AND tipdocstatus = 'A'
                            """
                        )

                        tipo_existe = connection.execute(query_tipo, {"ciacodigo": ciacodigo, "tipdoccodigo": field_value}).fetchone()

                        if not tipo_existe:
                            return jsonify({"error": {"success": False, "message": f"El valor '{field_value}' para {field} no existe o está inactivo en gdocbtipodoc"}}), 400

                # ============================================
                # 2. OBTENER SIGUIENTE SECUENCIA
                # ============================================
                query_secuencia = text(
                    """
                    SELECT ISNULL(MAX(docsecuen), 0) + 1 as siguiente_secuencia
                    FROM gdocmdocumentos
                    WHERE ciacodigo = :ciacodigo
                        AND docqgenero = :docqgenero
                        AND docprocqgenero = :docprocqgenero
                    """
                )

                siguiente_secuencia = connection.execute(query_secuencia, {"ciacodigo": ciacodigo, "docqgenero": docqgenero, "docprocqgenero": docprocqgenero}).scalar()

                # ============================================
                # 3. PREPARAR DATOS DE FECHAS (opcionales)
                # ============================================
                docfecemi = form_data.get("docfecemi")
                docfecven = form_data.get("docfecven")

                # Validar formato de fechas si existen
                fecha_emision = None
                fecha_vencimiento = None

                if docfecemi:
                    try:
                        fecha_emision = datetime.strptime(docfecemi, "%Y-%m-%d").date()
                    except ValueError:
                        return jsonify({"error": {"success": False, "message": "Formato de fecha de emisión inválido. Use YYYY-MM-DD"}}), 400

                if docfecven:
                    try:
                        fecha_vencimiento = datetime.strptime(docfecven, "%Y-%m-%d").date()
                    except ValueError:
                        return jsonify({"error": {"success": False, "message": "Formato de fecha de vencimiento inválido. Use YYYY-MM-DD"}}), 400

                # Validar que vencimiento no sea anterior a emisión
                if fecha_emision and fecha_vencimiento and fecha_vencimiento < fecha_emision:
                    return jsonify({"error": {"success": False, "message": "La fecha de vencimiento no puede ser anterior a la fecha de emisión"}}), 400

                # ============================================
                # 4. INSERTAR NUEVO DOCUMENTO
                # ============================================
                insert_query = text(
                    """
                    INSERT INTO gdocmdocumentos (
                        ciacodigo, documentouuid,
                        docqgenero, docprocqgenero, docsecuen,
                        docnombre, docextension, documento,
                        docfecemi, docfecven,
                        docindex1, docindex2, docindex3,
                        docindex4, docindex5, docindex6,
                        docfechorisys, docusuisys, docestisys
                    ) VALUES (
                        :ciacodigo, NEWID(),
                        :docqgenero, :docprocqgenero, :docsecuen,
                        :docnombre, :docextension, CAST(:documento AS varbinary(max)),
                        :docfecemi, :docfecven,
                        :docindex1, :docindex2, :docindex3,
                        :docindex4, :docindex5, :docindex6,
                        :fecha_con_hora_cero, :usuario_actual, :estacion_actual
                    )
                    """
                )

                connection.execute(
                    insert_query,
                    {
                        "ciacodigo": ciacodigo,
                        "docqgenero": docqgenero,
                        "docprocqgenero": docprocqgenero,
                        "docsecuen": siguiente_secuencia,
                        "docnombre": form_data.get("docnombre", ""),
                        "docextension": extension,
                        "documento": archivo_binario,
                        "docfecemi": fecha_emision,
                        "docfecven": fecha_vencimiento,
                        "docindex1": null_si_vacio(form_data.get("docindex1")),
                        "docindex2": null_si_vacio(form_data.get("docindex2")),
                        "docindex3": null_si_vacio(form_data.get("docindex3")),
                        "docindex4": null_si_vacio(form_data.get("docindex4")),
                        "docindex5": null_si_vacio(form_data.get("docindex5")),
                        "docindex6": form_data.get("docindex6", ""),
                        "fecha_con_hora_cero": fecha_con_hora_cero,
                        "usuario_actual": usuario_actual,
                        "estacion_actual": estacion_actual,
                    },
                )

                # ============================================
                # 5. OBTENER DOCUMENTO RECIÉN CREADO
                # ============================================
                query_nuevo = text(
                    """
                    SELECT
                        d.documentouuid,
                        d.docsecuen,
                        d.docnombre,
                        d.docextension,
                        d.docfecemi,
                        d.docfecven,
                        d.docindex1,
                        t1.tipdocdescri as docindex1_descri,
                        d.docindex2,
                        t2.tipdocdescri as docindex2_descri,
                        d.docindex3,
                        t3.tipdocdescri as docindex3_descri,
                        d.docindex4,
                        t4.tipdocdescri as docindex4_descri,
                        d.docindex5,
                        t5.tipdocdescri as docindex5_descri,
                        d.docindex6,
                        d.docfechorisys,
                        d.docusuisys,
                        d.docestisys,
                        d.docqgenero,
                        d.docprocqgenero
                    FROM gdocmdocumentos d
                    LEFT JOIN gdocbtipodoc t1 ON d.ciacodigo = t1.ciacodigo
                        AND d.docindex1 = t1.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t2 ON d.ciacodigo = t2.ciacodigo
                        AND d.docindex2 = t2.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t3 ON d.ciacodigo = t3.ciacodigo
                        AND d.docindex3 = t3.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t4 ON d.ciacodigo = t4.ciacodigo
                        AND d.docindex4 = t4.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t5 ON d.ciacodigo = t5.ciacodigo
                        AND d.docindex5 = t5.tipdoccodigo
                    WHERE d.ciacodigo = :ciacodigo
                        AND d.docqgenero = :docqgenero
                        AND d.docprocqgenero = :docprocqgenero
                        AND d.docsecuen = :docsecuen
                    """
                )

                nuevo_doc = connection.execute(query_nuevo, {"ciacodigo": ciacodigo, "docqgenero": docqgenero, "docprocqgenero": docprocqgenero, "docsecuen": siguiente_secuencia}).mappings().first()

                nuevo_doc_dict = dict(nuevo_doc) if nuevo_doc else {}

                # Formatear UUID y fechas
                if nuevo_doc_dict.get("documentouuid"):
                    nuevo_doc_dict["documentouuid"] = str(nuevo_doc_dict["documentouuid"])

                for fecha_field in ["docfecemi", "docfecven", "docfechorisys"]:
                    if nuevo_doc_dict.get(fecha_field):
                        nuevo_doc_dict[fecha_field] = nuevo_doc_dict[fecha_field].isoformat() if hasattr(nuevo_doc_dict[fecha_field], "isoformat") else str(nuevo_doc_dict[fecha_field])

                # Para compatibilidad con frontend existente
                nuevo_doc_dict["tipdoccodigo"] = nuevo_doc_dict.get("docindex3", "")
                nuevo_doc_dict["tipdocdescri"] = nuevo_doc_dict.get("docindex3_descri", "")

                return jsonify({"success": True, "message": "Documento creado exitosamente", "data": nuevo_doc_dict}), 200

    except Exception as e:
        print(f"Error en createNewDocumento: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al crear documento: {str(e)}"}}), 500


# =================================================================
# 4. PUT: editSpecificDocumento
# =================================================================


@bp.route("/editSpecificDocumento", methods=["PUT"])
@cross_origin()
@jwt_required()
def edit_specific_documento():
    """
    Edita un documento existente
    - Si viene con archivo: actualiza metadatos + contenido
    - Si viene sin archivo: actualiza solo metadatos
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        # Verificar si viene con archivo (FormData) o sin archivo (JSON)
        if request.files:
            # ============================================
            # CASO 1: VIENE CON ARCHIVO (editar clave .clv)
            # ============================================
            archivo = request.files.get("archivo")
            if not archivo:
                return jsonify({"error": {"success": False, "message": "No se recibió ningún archivo"}}), 400

            form_data = request.form.to_dict()
            documentouuid = form_data.get("documentouuid")

            # Leer y procesar el archivo (igual que en create)
            nombre_archivo = archivo.filename
            extension = nombre_archivo.split(".")[-1].lower() if "." in nombre_archivo else ""

            # Leer según tipo (igual que create)
            if extension == "clv":
                contenido_texto = archivo.read().decode("utf-8")
                string_encriptado = encriptar(contenido_texto)
                archivo_binario = string_encriptado.encode("utf-8")
            else:
                archivo_binario = archivo.read()

            datos = form_data  # Los datos vienen del form
            tiene_archivo = True

        else:
            # ============================================
            # CASO 2: SIN ARCHIVO (solo metadatos)
            # ============================================
            datos = request.get_json()
            documentouuid = datos.get("documentouuid")
            tiene_archivo = False
            archivo_binario = None
            extension = None

        # Validar datos requeridos
        if not documentouuid:
            return jsonify({"error": {"success": False, "message": "documentouuid es requerido"}}), 400

        docindex6 = datos.get("docindex6")
        if not docindex6 or not docindex6.strip():
            return jsonify({"error": {"success": False, "message": "Etiqueta 6 (Texto libre obligatorio) es requerida"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            with connection.begin():
                # ============================================
                # 1. VERIFICAR QUE EL DOCUMENTO EXISTA
                # ============================================
                query_existe = text(
                    """
                    SELECT docsecuen, docqgenero, docprocqgenero, docextension
                    FROM gdocmdocumentos
                    WHERE ciacodigo = :ciacodigo
                        AND documentouuid = :documentouuid
                    """
                )

                documento_existe = connection.execute(query_existe, {"ciacodigo": ciacodigo, "documentouuid": documentouuid}).mappings().first()

                if not documento_existe:
                    return jsonify({"error": {"success": False, "message": "Documento no encontrado"}}), 404

                # ============================================
                # 2. VALIDAR QUE LOS docindex1-5 EXISTAN
                # ============================================
                docindex_fields = ["docindex1", "docindex2", "docindex3", "docindex4", "docindex5"]

                for field in docindex_fields:
                    field_value = datos.get(field)
                    if field_value:
                        query_tipo = text(
                            """
                            SELECT tipdoccodigo
                            FROM gdocbtipodoc
                            WHERE ciacodigo = :ciacodigo
                                AND tipdoccodigo = :tipdoccodigo
                                AND tipdocstatus = 'A'
                            """
                        )

                        tipo_existe = connection.execute(query_tipo, {"ciacodigo": ciacodigo, "tipdoccodigo": field_value}).fetchone()

                        if not tipo_existe:
                            return jsonify({"error": {"success": False, "message": f"El valor '{field_value}' para {field} no existe o está inactivo"}}), 400

                # ============================================
                # 3. PREPARAR DATOS DE FECHAS
                # ============================================
                docfecemi = datos.get("docfecemi")
                docfecven = datos.get("docfecven")

                fecha_emision = None
                fecha_vencimiento = None

                if docfecemi and docfecemi.strip():
                    try:
                        fecha_emision = datetime.strptime(docfecemi, "%Y-%m-%d").date()
                    except ValueError:
                        return jsonify({"error": {"success": False, "message": "Formato de fecha de emisión inválido"}}), 400

                if docfecven and docfecven.strip():
                    try:
                        fecha_vencimiento = datetime.strptime(docfecven, "%Y-%m-%d").date()
                    except ValueError:
                        return jsonify({"error": {"success": False, "message": "Formato de fecha de vencimiento inválido"}}), 400

                if fecha_emision and fecha_vencimiento and fecha_vencimiento < fecha_emision:
                    return jsonify({"error": {"success": False, "message": "La fecha de vencimiento no puede ser anterior a la fecha de emisión"}}), 400

                # ============================================
                # 4. CONSTRUIR QUERY DE ACTUALIZACIÓN
                # ============================================
                if tiene_archivo:
                    # UPDATE con archivo (para claves)
                    update_query = text(
                        """
                        UPDATE gdocmdocumentos
                        SET
                            docnombre = :docnombre,
                            docextension = :docextension,
                            documento = CAST(:documento AS varbinary(max)),
                            docfecemi = :docfecemi,
                            docfecven = :docfecven,
                            docindex1 = :docindex1,
                            docindex2 = :docindex2,
                            docindex3 = :docindex3,
                            docindex4 = :docindex4,
                            docindex5 = :docindex5,
                            docindex6 = :docindex6
                        WHERE ciacodigo = :ciacodigo
                            AND documentouuid = :documentouuid
                        """
                    )

                    params = {
                        "ciacodigo": ciacodigo,
                        "documentouuid": documentouuid,
                        "docnombre": datos.get("docnombre", ""),
                        "docextension": extension,
                        "documento": archivo_binario,
                        "docfecemi": fecha_emision,
                        "docfecven": fecha_vencimiento,
                        "docindex1": null_si_vacio(datos.get("docindex1")),
                        "docindex2": null_si_vacio(datos.get("docindex2")),
                        "docindex3": null_si_vacio(datos.get("docindex3")),
                        "docindex4": null_si_vacio(datos.get("docindex4")),
                        "docindex5": null_si_vacio(datos.get("docindex5")),
                        "docindex6": datos.get("docindex6", ""),
                    }
                else:
                    # UPDATE solo metadatos (sin archivo)
                    update_query = text(
                        """
                        UPDATE gdocmdocumentos
                        SET
                            docnombre = COALESCE(:docnombre, docnombre),
                            docfecemi = :docfecemi,
                            docfecven = :docfecven,
                            docindex1 = :docindex1,
                            docindex2 = :docindex2,
                            docindex3 = :docindex3,
                            docindex4 = :docindex4,
                            docindex5 = :docindex5,
                            docindex6 = :docindex6
                        WHERE ciacodigo = :ciacodigo
                            AND documentouuid = :documentouuid
                        """
                    )

                    params = {
                        "ciacodigo": ciacodigo,
                        "documentouuid": documentouuid,
                        "docnombre": datos.get("docnombre", ""),
                        "docfecemi": fecha_emision,
                        "docfecven": fecha_vencimiento,
                        "docindex1": null_si_vacio(datos.get("docindex1")),
                        "docindex2": null_si_vacio(datos.get("docindex2")),
                        "docindex3": null_si_vacio(datos.get("docindex3")),
                        "docindex4": null_si_vacio(datos.get("docindex4")),
                        "docindex5": null_si_vacio(datos.get("docindex5")),
                        "docindex6": datos.get("docindex6", ""),
                    }

                connection.execute(update_query, params)

                # ============================================
                # 5. OBTENER DOCUMENTO ACTUALIZADO
                # ============================================
                query_actualizado = text(
                    """
                    SELECT
                        d.documentouuid,
                        d.docsecuen,
                        d.docnombre,
                        d.docextension,
                        d.docfecemi,
                        d.docfecven,
                        d.docindex1,
                        t1.tipdocdescri as docindex1_descri,
                        d.docindex2,
                        t2.tipdocdescri as docindex2_descri,
                        d.docindex3,
                        t3.tipdocdescri as docindex3_descri,
                        d.docindex4,
                        t4.tipdocdescri as docindex4_descri,
                        d.docindex5,
                        t5.tipdocdescri as docindex5_descri,
                        d.docindex6,
                        d.docfechorisys,
                        d.docusuisys,
                        d.docestisys,
                        d.docqgenero,
                        d.docprocqgenero
                    FROM gdocmdocumentos d
                    LEFT JOIN gdocbtipodoc t1 ON d.ciacodigo = t1.ciacodigo
                        AND d.docindex1 = t1.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t2 ON d.ciacodigo = t2.ciacodigo
                        AND d.docindex2 = t2.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t3 ON d.ciacodigo = t3.ciacodigo
                        AND d.docindex3 = t3.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t4 ON d.ciacodigo = t4.ciacodigo
                        AND d.docindex4 = t4.tipdoccodigo
                    LEFT JOIN gdocbtipodoc t5 ON d.ciacodigo = t5.ciacodigo
                        AND d.docindex5 = t5.tipdoccodigo
                    WHERE d.ciacodigo = :ciacodigo
                        AND d.documentouuid = :documentouuid
                    """
                )

                doc_actualizado = connection.execute(query_actualizado, {"ciacodigo": ciacodigo, "documentouuid": documentouuid}).mappings().first()

                doc_actualizado_dict = dict(doc_actualizado) if doc_actualizado else {}

                # Formatear UUID y fechas
                if doc_actualizado_dict.get("documentouuid"):
                    doc_actualizado_dict["documentouuid"] = str(doc_actualizado_dict["documentouuid"])

                for fecha_field in ["docfecemi", "docfecven", "docfechorisys"]:
                    if doc_actualizado_dict.get(fecha_field):
                        doc_actualizado_dict[fecha_field] = doc_actualizado_dict[fecha_field].isoformat() if hasattr(doc_actualizado_dict[fecha_field], "isoformat") else str(doc_actualizado_dict[fecha_field])

                # Para compatibilidad con frontend
                doc_actualizado_dict["tipdoccodigo"] = doc_actualizado_dict.get("docindex3", "")
                doc_actualizado_dict["tipdocdescri"] = doc_actualizado_dict.get("docindex3_descri", "")

                return jsonify({"success": True, "message": "Documento actualizado exitosamente", "data": doc_actualizado_dict}), 200

    except Exception as e:
        print(f"Error en editSpecificDocumento: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al actualizar documento: {str(e)}"}}), 500


# =================================================================
# 5. DELETE: deleteSpecificDocumento
# =================================================================


@bp.route("/deleteSpecificDocumento", methods=["DELETE"])
@cross_origin()
@jwt_required()
def delete_specific_documento():
    """
    Elimina un documento específico - MODIFICADO: Solo elimina original si NO tiene referencias
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        data = request.get_json()
        documentouuid = data.get("documentouuid")

        if not documentouuid:
            return jsonify({"error": {"success": False, "message": "documentouuid es requerido"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            with connection.begin():
                # ============================================
                # 1. OBTENER INFORMACIÓN DEL DOCUMENTO A ELIMINAR
                # ============================================
                query_info = text(
                    """
                    SELECT
                        docsecuen,
                        docqgenero,
                        docprocqgenero,
                        documento_origen_uuid,
                        docnombre,
                        documento  -- Para ver si tiene archivo físico
                    FROM gdocmdocumentos
                    WHERE ciacodigo = :ciacodigo
                        AND documentouuid = :documentouuid
                """
                )

                doc_info = connection.execute(query_info, {"ciacodigo": ciacodigo, "documentouuid": documentouuid}).mappings().first()

                if not doc_info:
                    return jsonify({"error": {"success": False, "message": "Documento no encontrado"}}), 404

                doc_info = dict(doc_info)
                secuencia_eliminar = doc_info["docsecuen"]
                docqgenero = doc_info["docqgenero"]
                docprocqgenero = doc_info["docprocqgenero"]
                documento_origen_uuid = doc_info["documento_origen_uuid"]
                docnombre = doc_info["docnombre"]
                tiene_archivo_fisico = doc_info["documento"] is not None

                # ============================================
                # 2. VALIDAR SI PUEDE ELIMINARSE
                # ============================================
                mensaje_error = None

                # Caso A: Es documento ORIGINAL (tiene archivo físico)
                if tiene_archivo_fisico:
                    # Verificar si tiene referencias
                    query_referencias = text(
                        """
                        SELECT COUNT(*) as total_referencias
                        FROM gdocmdocumentos
                        WHERE ciacodigo = :ciacodigo
                            AND documento_origen_uuid = :documentouuid
                    """
                    )

                    total_referencias = connection.execute(query_referencias, {"ciacodigo": ciacodigo, "documentouuid": documentouuid}).scalar()

                    if total_referencias > 0:
                        mensaje_error = f'No se puede eliminar "{docnombre}". Es un documento ORIGINAL y tiene {total_referencias} referencia(s) asociada(s).'

                # Caso B: Es REFERENCIA (documento_origen_uuid NO es NULL)
                elif documento_origen_uuid is not None:
                    # Las referencias SI se pueden eliminar siempre
                    # No hay restricción
                    pass

                # Caso C: Es documento sin archivo pero sin referencia (caso raro)
                else:
                    # Documento sin archivo y sin referencia (posible error)
                    # Se puede eliminar
                    pass

                # Si hay error, retornar
                if mensaje_error:
                    return jsonify({"error": {"success": False, "message": mensaje_error, "esOriginalConReferencias": True}}), 400

                # ============================================
                # 3. ELIMINAR EL DOCUMENTO (si pasa validación)
                # ============================================
                delete_query = text(
                    """
                    DELETE FROM gdocmdocumentos
                    WHERE ciacodigo = :ciacodigo
                        AND documentouuid = :documentouuid
                """
                )

                connection.execute(delete_query, {"ciacodigo": ciacodigo, "documentouuid": documentouuid})

                # ============================================
                # 4. REORDENAR SECUENCIAS (solo para documentos de la misma entidad)
                # ============================================
                documentos_restantes = []

                # Solo reordenar si era un documento de esta entidad (no importa si era original o referencia)
                query_restantes = text(
                    """
                    SELECT
                        documentouuid,
                        docsecuen
                    FROM gdocmdocumentos
                    WHERE ciacodigo = :ciacodigo
                        AND docqgenero = :docqgenero
                        AND docprocqgenero = :docprocqgenero
                    ORDER BY docsecuen
                """
                )

                documentos_restantes = connection.execute(query_restantes, {"ciacodigo": ciacodigo, "docqgenero": docqgenero, "docprocqgenero": docprocqgenero}).fetchall()

                # Actualizar secuencias secuencialmente
                nueva_secuencia = 1
                for doc in documentos_restantes:
                    update_secuencia_query = text(
                        """
                        UPDATE gdocmdocumentos
                        SET docsecuen = :nueva_secuencia
                        WHERE ciacodigo = :ciacodigo
                            AND documentouuid = :documentouuid
                    """
                    )

                    connection.execute(update_secuencia_query, {"ciacodigo": ciacodigo, "documentouuid": doc[0], "nueva_secuencia": nueva_secuencia})
                    nueva_secuencia += 1

                return jsonify({"success": True, "message": "Documento eliminado exitosamente", "data": {"documentos_restantes": len(documentos_restantes), "secuencia_eliminada": secuencia_eliminar, "eraOriginal": tiene_archivo_fisico, "eraReferencia": documento_origen_uuid is not None}}), 200

    except Exception as e:
        print(f"Error en deleteSpecificDocumento: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al eliminar documento: {str(e)}"}}), 500


# =================================================================
# 6. POST: downloadSpecificDocumento
# =================================================================


@bp.route("/downloadSpecificDocumento", methods=["POST"])
@cross_origin()
@jwt_required()
def download_specific_documento():
    """
    Descarga documento - MODIFICADO para manejar referencias
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        data = request.get_json()
        documentouuid = data.get("documentouuid")

        if not documentouuid:
            return jsonify({"error": {"success": False, "message": "documentouuid es requerido"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # Primero obtener el documento (puede ser original o referencia)
            query = text(
                """
                SELECT
                    d.documentouuid,
                    d.documento_origen_uuid,
                    d.docextension,
                    d.docnombre,
                    d.documento
                FROM gdocmdocumentos d
                WHERE d.ciacodigo = :ciacodigo
                  AND d.documentouuid = :documentouuid
            """
            )

            result = connection.execute(query, {"ciacodigo": ciacodigo, "documentouuid": documentouuid}).mappings().first()

            if not result:
                return jsonify({"error": {"success": False, "message": "Documento no encontrado"}}), 404

            documento_data = dict(result)
            documento_origen_uuid = documento_data.get("documento_origen_uuid")

            # Si es una referencia, obtener el documento original
            if documento_origen_uuid:
                query_original = text(
                    """
                    SELECT
                        documento,
                        docextension,
                        docnombre
                    FROM gdocmdocumentos
                    WHERE ciacodigo = :ciacodigo
                      AND documentouuid = :documentouuid
                """
                )

                original_result = connection.execute(query_original, {"ciacodigo": ciacodigo, "documentouuid": documento_origen_uuid}).mappings().first()

                if not original_result:
                    return jsonify({"error": {"success": False, "message": "Documento original no encontrado"}}), 404

                original_data = dict(original_result)
                archivo_bytes = original_data["documento"]
                extension = original_data["docextension"] or documento_data["docextension"]
                nombre_archivo = documento_data["docnombre"] or original_data["docnombre"]
            else:
                # Es documento original
                archivo_bytes = documento_data["documento"]
                extension = documento_data["docextension"]
                nombre_archivo = documento_data["docnombre"]

            if not archivo_bytes:
                return jsonify({"error": {"success": False, "message": "El documento no tiene archivo asociado"}}), 404

            from flask import make_response
            from urllib.parse import quote

            # Normalizar nombre
            nombre_archivo = (nombre_archivo or "DOCUMENTO").strip().upper()
            extension = (extension or "BIN").strip().upper()

            if not nombre_archivo.endswith(f".{extension}"):
                nombre_archivo = f"{nombre_archivo}.{extension}"

            if len(nombre_archivo.split(".")[0]) < 5:
                nombre_archivo = f"DOCUMENTO_{nombre_archivo}"

            # Crear respuesta
            response = make_response(archivo_bytes)
            response.headers["Content-Type"] = "application/octet-stream"
            response.headers["Content-Disposition"] = f'attachment; filename="{nombre_archivo}"; ' f"filename*=UTF-8''{quote(nombre_archivo)}"
            response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"

            return response

    except Exception as e:
        print(f"Error en downloadSpecificDocumento: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al descargar documento: {str(e)}"}}), 500


# =================================================================
# 7. POST: buscarDocumentosParaImportar (NUEVO)
# =================================================================


@bp.route("/buscarDocumentosParaImportar", methods=["POST"])
@cross_origin()
@jwt_required()
def buscar_documentos_para_importar():
    """
    Busca documentos ORIGINALES para importar - CON PAGINACIÓN
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        data = request.get_json()

        # Obtener filtros y paginación
        nombre = data.get("nombre")
        docindex1 = data.get("docindex1")
        docindex2 = data.get("docindex2")
        docindex3 = data.get("docindex3")
        docindex4 = data.get("docindex4")
        docindex5 = data.get("docindex5")
        docindex6 = data.get("docindex6")

        # Parámetros de paginación
        page = data.get("page", 1)
        per_page = data.get("per_page", 20)
        offset = (page - 1) * per_page

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # Construir WHERE dinámico
            condiciones = ["d.ciacodigo = :ciacodigo"]
            condiciones.append("d.documento_origen_uuid IS NULL")  # Solo originales

            params = {"ciacodigo": ciacodigo}

            # ¡CORRECCIÓN! Filtro por nombre - estaba mal
            if nombre and nombre.strip():
                condiciones.append("d.docnombre LIKE '%' + :nombre + '%'")
                params["nombre"] = nombre.strip()

            # Filtros por etiquetas 1-5 (exacto)
            if docindex1:
                condiciones.append("d.docindex1 = :docindex1")
                params["docindex1"] = docindex1

            if docindex2:
                condiciones.append("d.docindex2 = :docindex2")
                params["docindex2"] = docindex2

            if docindex3:
                condiciones.append("d.docindex3 = :docindex3")
                params["docindex3"] = docindex3

            if docindex4:
                condiciones.append("d.docindex4 = :docindex4")
                params["docindex4"] = docindex4

            if docindex5:
                condiciones.append("d.docindex5 = :docindex5")
                params["docindex5"] = docindex5

            # Filtro por etiqueta 6 (LIKE)
            if docindex6 and docindex6.strip():
                condiciones.append("d.docindex6 LIKE '%' + :docindex6 + '%'")
                params["docindex6"] = docindex6.strip()

            where_clause = " AND d.docextension != 'clv' AND ".join(condiciones)

            # Query para contar TOTAL (sin OFFSET/LIMIT)
            count_query = text(
                f"""
                SELECT COUNT(*) as total
                FROM gdocmdocumentos d
                WHERE {where_clause}
            """
            )

            total_result = connection.execute(count_query, params).fetchone()
            total_documentos = total_result[0] if total_result else 0

            # Query principal CON PAGINACIÓN
            query = text(
                f"""
                SELECT
                    d.documentouuid,
                    d.docnombre,
                    d.docextension,
                    d.docfecemi,
                    d.docfecven,
                    d.docindex1,
                    t1.tipdocdescri as docindex1_descri,
                    d.docindex2,
                    t2.tipdocdescri as docindex2_descri,
                    d.docindex3,
                    t3.tipdocdescri as docindex3_descri,
                    d.docindex4,
                    t4.tipdocdescri as docindex4_descri,
                    d.docindex5,
                    t5.tipdocdescri as docindex5_descri,
                    d.docindex6,
                    d.docqgenero,
                    d.docprocqgenero,
                    d.docsecuen,
                    d.docfechorisys
                FROM gdocmdocumentos d
                LEFT JOIN gdocbtipodoc t1 ON d.ciacodigo = t1.ciacodigo
                    AND d.docindex1 = t1.tipdoccodigo
                LEFT JOIN gdocbtipodoc t2 ON d.ciacodigo = t2.ciacodigo
                    AND d.docindex2 = t2.tipdoccodigo
                LEFT JOIN gdocbtipodoc t3 ON d.ciacodigo = t3.ciacodigo
                    AND d.docindex3 = t3.tipdoccodigo
                LEFT JOIN gdocbtipodoc t4 ON d.ciacodigo = t4.ciacodigo
                    AND d.docindex4 = t4.tipdoccodigo
                LEFT JOIN gdocbtipodoc t5 ON d.ciacodigo = t5.ciacodigo
                    AND d.docindex5 = t5.tipdoccodigo
                WHERE {where_clause}
                ORDER BY d.docfechorisys DESC
                OFFSET :offset ROWS
                FETCH NEXT :per_page ROWS ONLY
            """
            )

            # Agregar parámetros de paginación
            params["offset"] = offset
            params["per_page"] = per_page

            result = connection.execute(query, params)
            documentos = [dict(row) for row in result.mappings()]

            # Formatear respuesta
            for doc in documentos:
                if doc.get("documentouuid"):
                    doc["documentouuid"] = str(doc["documentouuid"])

                # Entidad de origen (para mostrar al usuario)
                entidad_tipo = doc.get("docqgenero", "")
                entidad_id = doc.get("docprocqgenero", "")
                doc["entidad_origen"] = f"{entidad_tipo} {entidad_id}"

                # Formatear fechas
                for fecha_field in ["docfecemi", "docfecven", "docfechorisys"]:
                    if doc.get(fecha_field):
                        doc[fecha_field] = doc[fecha_field].isoformat() if hasattr(doc[fecha_field], "isoformat") else str(doc[fecha_field])

            return jsonify({"success": True, "message": "Documentos encontrados", "data": documentos, "pagination": {"total": total_documentos, "page": page, "perPage": per_page, "totalPages": (total_documentos + per_page - 1) // per_page}}), 200  # camelCase  # camelCase

    except Exception as e:
        print(f"Error en buscarDocumentosParaImportar: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al buscar documentos: {str(e)}"}}), 500


# =================================================================
# 8. POST: importarDocumentos (NUEVO)
# =================================================================


@bp.route("/importarDocumentos", methods=["POST"])
@cross_origin()
@jwt_required()
def importar_documentos():
    """
    Crea referencias a documentos existentes
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]
        usuario_actual = claims["user"]
        estacion_actual = request.headers.get("X-Forwarded-For", request.remote_addr)

        data = request.get_json()
        documentos_a_importar = data.get("documentosAImportar", [])  # camelCase
        entidad_destino = data.get("entidadDestino", {})  # camelCase

        docqgenero_destino = entidad_destino.get("docqgenero")
        docprocqgenero_destino = entidad_destino.get("docprocqgenero")

        # Validaciones
        if not documentos_a_importar:
            return jsonify({"error": {"success": False, "message": "No se seleccionaron documentos para importar"}}), 400

        if not docqgenero_destino or not docprocqgenero_destino:
            return jsonify({"error": {"success": False, "message": "Se requiere especificar la entidad destino"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        documentos_importados = []

        with engine.connect() as connection:
            with connection.begin():
                # Obtener siguiente secuencia para la entidad destino
                query_secuencia = text(
                    """
                    SELECT ISNULL(MAX(docsecuen), 0) + 1 as siguiente_secuencia
                    FROM gdocmdocumentos
                    WHERE ciacodigo = :ciacodigo
                        AND docqgenero = :docqgenero
                        AND docprocqgenero = :docprocqgenero
                """
                )

                siguiente_secuencia = connection.execute(query_secuencia, {"ciacodigo": ciacodigo, "docqgenero": docqgenero_destino, "docprocqgenero": docprocqgenero_destino}).scalar()

                # Para cada documento a importar
                for doc_uuid in documentos_a_importar:
                    # 1. Obtener documento original
                    query_original = text(
                        """
                        SELECT
                            documentouuid, docnombre, docextension,
                            docfecemi, docfecven,
                            docindex1, docindex2, docindex3,
                            docindex4, docindex5, docindex6
                        FROM gdocmdocumentos
                        WHERE ciacodigo = :ciacodigo
                            AND documentouuid = :documentouuid
                            AND documento_origen_uuid IS NULL  -- Solo originales
                    """
                    )

                    original = connection.execute(query_original, {"ciacodigo": ciacodigo, "documentouuid": doc_uuid}).mappings().first()

                    if not original:
                        continue  # Saltar si no existe

                    original = dict(original)

                    # 2. Crear referencia
                    insert_query = text(
                        """
                        INSERT INTO gdocmdocumentos (
                            ciacodigo, documentouuid, documento_origen_uuid,
                            docqgenero, docprocqgenero, docsecuen,
                            docnombre, docextension, documento,
                            docfecemi, docfecven,
                            docindex1, docindex2, docindex3,
                            docindex4, docindex5, docindex6,
                            docfechorisys, docusuisys, docestisys
                        ) VALUES (
                            :ciacodigo, NEWID(), :documento_origen_uuid,
                            :docqgenero, :docprocqgenero, :docsecuen,
                            :docnombre, :docextension, NULL,  -- ¡documento = NULL!
                            :docfecemi, :docfecven,
                            :docindex1, :docindex2, :docindex3,
                            :docindex4, :docindex5, :docindex6,
                            :fecha_con_hora_cero, :usuario_actual, :estacion_actual
                        )
                    """
                    )

                    connection.execute(
                        insert_query,
                        {
                            "ciacodigo": ciacodigo,
                            "documento_origen_uuid": doc_uuid,
                            "docqgenero": docqgenero_destino,
                            "docprocqgenero": docprocqgenero_destino,
                            "docsecuen": siguiente_secuencia,
                            "docnombre": original["docnombre"],
                            "docextension": original["docextension"],
                            "docfecemi": original["docfecemi"],
                            "docfecven": original["docfecven"],
                            "docindex1": original["docindex1"],
                            "docindex2": original["docindex2"],
                            "docindex3": original["docindex3"],
                            "docindex4": original["docindex4"],
                            "docindex5": original["docindex5"],
                            "docindex6": original["docindex6"],
                            "fecha_con_hora_cero": fecha_con_hora_cero,
                            "usuario_actual": usuario_actual,
                            "estacion_actual": estacion_actual,
                        },
                    )

                    documentos_importados.append({"documento_origen_uuid": str(doc_uuid), "nueva_secuencia": siguiente_secuencia})

                    siguiente_secuencia += 1

                return jsonify({"success": True, "message": f"{len(documentos_importados)} documentos importados exitosamente", "data": documentos_importados}), 200

    except Exception as e:
        print(f"Error en importarDocumentos: {e}")
        return jsonify({"error": {"success": False, "message": f"Error al importar documentos: {str(e)}"}}), 500


@bp.route("/getDocumentoContent", methods=["POST"])
@cross_origin()
@jwt_required()
def get_documento_content():
    """
    Obtiene el contenido desencriptado de un documento
    Útil para claves (extensión .clv)
    """
    try:
        claims = get_jwt()
        clicianonBD = claims["seleccion"]["clicianonBD"]
        ciacodigo = claims["seleccion"]["cliciaciacodigo"]

        data = request.get_json()
        documentouuid = data.get("documentouuid")

        if not documentouuid:
            return jsonify({"error": {"success": False, "message": "documentouuid es requerido"}}), 400

        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # Obtener el documento - incluyendo todos los campos de la PK para evitar ambigüedad
            query = text(
                """
                SELECT documento, docnombre, docextension, docqgenero, docprocqgenero, docsecuen
                FROM gdocmdocumentos
                WHERE ciacodigo = :ciacodigo
                  AND documentouuid = :documentouuid
            """
            )

            result = connection.execute(query, {"ciacodigo": ciacodigo, "documentouuid": documentouuid}).first()

            if not result:
                return jsonify({"error": {"success": False, "message": "Documento no encontrado"}}), 404

            # Asignar resultados incluyendo campos de PK
            documento_bytes, docnombre, docextension, docqgenero, docprocqgenero, docsecuen = result

            # Verificar que sea una clave
            if docextension != "clv":
                return jsonify({"error": {"success": False, "message": "Este endpoint solo es para claves (extensión .clv)"}}), 400

            # Los bytes en la BD son el resultado de encriptar (que es un string encriptado)
            # Primero convertimos los bytes a string (el string encriptado)
            string_encriptado = documento_bytes.decode("utf-8")
            # Luego desencriptamos ese string
            contenido_texto = desencriptar(string_encriptado)

            # Parsear el formato usuario;clave;url
            partes = contenido_texto.split(";")
            usuario = partes[0] if len(partes) > 0 else ""
            clave = partes[1] if len(partes) > 1 else ""
            url = partes[2] if len(partes) > 2 else ""

            return jsonify({"success": True, "data": {"documentouuid": documentouuid, "docnombre": docnombre, "docextension": docextension, "docqgenero": docqgenero, "docprocqgenero": docprocqgenero, "docsecuen": docsecuen, "usuario": usuario, "clave": clave, "url": url}}), 200

    except Exception as e:
        print(f"Error en getDocumentoContent: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": {"success": False, "message": f"Error al obtener contenido: {str(e)}"}}), 500
