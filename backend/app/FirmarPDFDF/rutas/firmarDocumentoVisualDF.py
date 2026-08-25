import io
import os
import json
import tempfile
import qrcode
from datetime import datetime
from flask import request, send_file, jsonify, make_response

from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import text
from app.db import get_session
from app.extensions import db
from services.encrip_desencrip import desencriptar

from PIL import Image, ImageDraw, ImageFont
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import signers, fields
from pyhanko.pdf_utils.images import PdfImage
from pyhanko.stamp import StaticStampStyle
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID
from app.FirmarPDFDF import bp
from error_handling import APIError


def error_response(msg, status=400):
    return make_response(jsonify({"success": False, "message": msg}), status)


def generar_sello_grafico(nombres, output_path):
    # 1. Dimensiones base (Escala de alta resolución 500x120 -> Equivale perfecto a los 200x48 pt del PDF)
    img_w = 500
    img_h = 120
    base_img = Image.new("RGB", (img_w, img_h), "white")
    draw = ImageDraw.Draw(base_img)

    # 2. Generar el código QR (border=0 elimina el margen blanco que impedía el ajuste)
    qr_data = f"Firmado electrónicamente por:\n{nombres}\nFecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    qr = qrcode.QRCode(version=1, box_size=10, border=0)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # Redimensionar el QR para que ocupe exactamente todo el alto del lienzo
    qr_img = qr_img.resize((img_h, img_h), Image.LANCZOS)

    # Pegar el QR en la esquina superior izquierda
    base_img.paste(qr_img, (0, 0))

    # 3. Dibujar el recuadro negro exterior característico de FirmaEC
    # draw.rectangle([0, 0, img_w - 1, img_h - 1], outline="black", width=2)

    # 4. Fuentes (Buscamos la típica tipografía Courier/Monoespaciada de la firma del estado)
    try:
        if os.name == "nt":  # Windows
            font_small = ImageFont.truetype("cour.ttf", 12)
            font_large = ImageFont.truetype("courbd.ttf", 18)
        else:  # Linux/Mac
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf", 12)
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf", 18)
    except Exception:
        # Fallback de seguridad
        font_small = ImageFont.load_default()
        font_large = ImageFont.load_default()

    # 5. Posicionamiento X (Alineado a la derecha del QR con un poco de padding)
    text_x = img_h + 15

    # 6. Textos descriptivos pequeños
    # draw.text((text_x, 15), "Validar únicamente en FirmaEC.", fill=(80, 80, 80), font=font_small)
    draw.text((text_x, 32), "Firmado electrónicamente por:", fill=(80, 80, 80), font=font_small)

    # 7. Procesar el Nombre Completo
    nombres_upper = str(nombres).upper().strip()
    parts = nombres_upper.split()

    # Separación inteligente para evitar que se desborde el texto
    if len(parts) >= 4:
        line1 = f"{parts[0]} {parts[1]}"
        line2 = " ".join(parts[2:])
    elif len(parts) == 3:
        line1 = f"{parts[0]} {parts[1]}"
        line2 = parts[2]
    else:
        line1 = nombres_upper
        line2 = ""

    # Efecto Sombra (La firma EC tiene un característico delineado cyan/azul bajo el nombre negro)
    # shadow_color = (0, 0, 0)  # Azul claro
    text_color = (0, 0, 0)  # Negro

    y_line1 = 55
    y_line2 = 80

    # Dibujar Línea 1 (Primero la sombra con desplazamiento, luego el texto)
    # draw.text((text_x + 2, y_line1 + 2), line1, fill=shadow_color, font=font_large)
    draw.text((text_x, y_line1), line1, fill=text_color, font=font_large)

    # Dibujar Línea 2 (Primero la sombra con desplazamiento, luego el texto)
    if line2:
        # draw.text((text_x + 2, y_line2 + 2), line2, fill=shadow_color, font=font_large)
        draw.text((text_x, y_line2), line2, fill=text_color, font=font_large)

    # 8. Guardar la imagen final
    base_img.save(output_path, format="JPEG", quality=100)


@bp.route("/firmarDocumentoVisualDF", methods=["POST"])
@jwt_required()
def firmarDocumentoVisualDF():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    pdf_file = request.files.get("documento")
    p12_file = request.files.get("firma")
    password = request.form.get("password")

    # Soporte multipágina y compatibilidad con coordenada individual
    firmas_coords_raw = request.form.get("firmas_coords")
    coords_list = []

    if firmas_coords_raw:
        try:
            coords_list = json.loads(firmas_coords_raw)
        except Exception:
            coords_list = []

    if not coords_list:
        try:
            page = int(request.form.get("page", 0))
            x = int(request.form.get("x", 100))
            y = int(request.form.get("y", 100))
            coords_list = [{"page": page, "x": x, "y": y}]
        except Exception as e:
            raise APIError(str(e))

    if not pdf_file:
        return error_response("Falta el Documento PDF.")

    p12_data = None
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        if not p12_file or not password:
            sql_cgb = text("SELECT locpathxml FROM cgblocal WHERE ciacodigo = :cia AND loccodigo = :loc")
            cgb_res = connection.execute(sql_cgb, {"cia": ciacodigo, "loc": loccodigo}).fetchone()
            if not cgb_res or not cgb_res[0]:
                return error_response("No existe una firma electrónica corporativa configurada en esta localidad.")

            sql_doc = text("SELECT documento, doc_datos_sensibles FROM gdocmdocumentos WHERE documentouuid = :uuid AND ciacodigo = :cia")
            doc_res = connection.execute(sql_doc, {"uuid": cgb_res[0], "cia": ciacodigo}).fetchone()

            if not doc_res or not doc_res[0] or not doc_res[1]:
                return error_response("El archivo de firma corporativa no se encuentra o está corrupto.")

            p12_data = doc_res[0]
            try:
                sensibles_str = doc_res[1].decode("utf-8")
                sensibles_json = desencriptar(sensibles_str)
                while sensibles_json and ord(sensibles_json[-1]) < 32:
                    sensibles_json = sensibles_json[:-1]
                datos_obj = json.loads(sensibles_json)
                password = datos_obj.get("clave_certificado", "")
            except Exception:
                return error_response("No se pudo descifrar la clave de la firma corporativa.")
        else:
            p12_data = p12_file.read()

    if not p12_data:
        return error_response("El archivo .p12 está vacío.")

    tmp_key_path = None
    tmp_cert_path = None
    tmp_img_path = None
    tmp_pdf_path = None

    try:
        try:
            private_key, certificate, _ = pkcs12.load_key_and_certificates(p12_data, password.encode("utf-8"), default_backend())
        except Exception:
            return error_response("La contraseña de la firma electrónica es incorrecta o el archivo P12 es inválido.")

        try:
            nombres = certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
        except Exception:
            nombres = "Firma Electrónica Autorizada"

        pem_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        pem_cert = certificate.public_bytes(serialization.Encoding.PEM)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as tmp_key:
            tmp_key.write(pem_key)
            tmp_key_path = tmp_key.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as tmp_cert:
            tmp_cert.write(pem_cert)
            tmp_cert_path = tmp_cert.name

        signer = signers.SimpleSigner.load(tmp_key_path, tmp_cert_path)

        # Generación del sello visual con la nueva función idéntica a FirmaEC
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpeg") as tmp_img:
            generar_sello_grafico(nombres, tmp_img.name)
            tmp_img_path = tmp_img.name

        pdf_file.seek(0)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
            tmp_pdf.write(pdf_file.read())
            tmp_pdf_path = tmp_pdf.name

        stamp_style = StaticStampStyle(background=PdfImage(tmp_img_path), border_width=0)

        for idx, item in enumerate(coords_list):
            p_page = int(item.get("page", 0))
            p_x = int(item.get("x", 100))
            p_y = int(item.get("y", 100))

            with open(tmp_pdf_path, "r+b") as doc:
                w = IncrementalPdfFileWriter(doc, strict=False)
                sig_field_name = f"Firma_DSOFT_{int(datetime.now().timestamp())}_{idx}"
                # Caja ajustada a los 48 Puntos requeridos
                box = (p_x, p_y, p_x + 200, p_y + 48)

                try:
                    fields.append_signature_field(w, fields.SigFieldSpec(sig_field_name=sig_field_name, on_page=p_page, box=box))
                except Exception:
                    fields.append_signature_field(w, fields.SigFieldSpec(sig_field_name=sig_field_name, on_page=0, box=box))

                meta = signers.PdfSignatureMetadata(field_name=sig_field_name)
                pdf_signer = signers.PdfSigner(signature_meta=meta, signer=signer, stamp_style=stamp_style)
                pdf_signer.sign_pdf(w, in_place=True)

        with open(tmp_pdf_path, "rb") as final_doc:
            final_bytes = final_doc.read()

        out_stream = io.BytesIO(final_bytes)
        out_stream.seek(0)
        safe_filename = getattr(pdf_file, "filename", "Documento_DSOFT.pdf")
        return send_file(
            out_stream,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"FIRMADO_EC_{safe_filename}",
        )

    except Exception as e:
        raise APIError(str(e))
    finally:
        for tmp_file in [tmp_key_path, tmp_cert_path, tmp_img_path, tmp_pdf_path]:
            if tmp_file and os.path.exists(tmp_file):
                try:
                    os.remove(tmp_file)
                except Exception:
                    pass
