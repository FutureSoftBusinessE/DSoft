import io
import os
import json
import tempfile
import qrcode
import traceback
from datetime import datetime
from flask import request, send_file, jsonify, make_response

from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import text
from app.db import get_session
from app.extensions import db
from services.encrip_desencrip import desencriptar

from PIL import Image
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import signers, fields
from pyhanko.pdf_utils.images import PdfImage
from pyhanko.stamp import StaticStampStyle
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID
from app.FirmarPDFDF import bp
from error_handling import api_endpoint, APIError, ValidationError


def error_response(msg, status=400):
    return make_response(jsonify({"success": False, "message": msg}), status)


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

    try:
        page = int(request.form.get("page", 0))
        x = int(request.form.get("x", 100))
        y = int(request.form.get("y", 100))
    except Exception as e:
        raise APIError(str(e))

    if not pdf_file:
        return error_response("Falta el Documento PDF.")

    p12_data = None
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # LÓGICA DE FIRMA GLOBAL (SI EL USUARIO NO ENVIÓ ARCHIVO/CLAVE MANUALMENTE)
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
    tmp_qr_path = None
    tmp_pdf_path = None
    try:
        try:
            private_key, certificate, _ = pkcs12.load_key_and_certificates(p12_data, password.encode("utf-8"), default_backend())
        except Exception:
            return error_response("La contraseña de la firma electrónica es incorrecta o el archivo P12 es inválido.")

        try:
            nombres = certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
        except Exception as e:
            raise APIError(str(e))
            nombres = "Firma Electrónica Autorizada"

        pem_key = private_key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.PKCS8, encryption_algorithm=serialization.NoEncryption())
        pem_cert = certificate.public_bytes(serialization.Encoding.PEM)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as tmp_key:
            tmp_key.write(pem_key)
            tmp_key_path = tmp_key.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as tmp_cert:
            tmp_cert.write(pem_cert)
            tmp_cert_path = tmp_cert.name

        signer = signers.SimpleSigner.load(tmp_key_path, tmp_cert_path)

        qr_data = f"Firmado digitalmente por:\n{nombres}\nFecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\nValidado por DSOFT"
        qr = qrcode.QRCode(box_size=10, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpeg") as tmp_qr:
            qr_img.save(tmp_qr.name, format="JPEG")
            tmp_qr_path = tmp_qr.name

        pdf_file.seek(0)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
            tmp_pdf.write(pdf_file.read())
            tmp_pdf_path = tmp_pdf.name

        with open(tmp_pdf_path, "r+b") as doc:
            w = IncrementalPdfFileWriter(doc, strict=False)
            sig_field_name = f"Firma_QR_DSOFT_{int(datetime.now().timestamp())}"
            box = (x, y, x + 100, y + 100)

            try:
                fields.append_signature_field(w, fields.SigFieldSpec(sig_field_name=sig_field_name, on_page=page, box=box))
            except Exception as e:
                raise APIError(str(e))
                fields.append_signature_field(w, fields.SigFieldSpec(sig_field_name=sig_field_name, on_page=0, box=box))

            stamp_style = StaticStampStyle(background=PdfImage(tmp_qr_path))
            meta = signers.PdfSignatureMetadata(field_name=sig_field_name)
            pdf_signer = signers.PdfSigner(signature_meta=meta, signer=signer, stamp_style=stamp_style)
            pdf_signer.sign_pdf(w, in_place=True)

        with open(tmp_pdf_path, "rb") as final_doc:
            final_bytes = final_doc.read()

        out_stream = io.BytesIO(final_bytes)
        out_stream.seek(0)
        safe_filename = getattr(pdf_file, "filename", "Documento_DSOFT.pdf")
        return send_file(out_stream, mimetype="application/pdf", as_attachment=True, download_name=f"FIRMADO_QR_{safe_filename}")
    except Exception as e:
        raise APIError(str(e))
    finally:
        for tmp_file in [tmp_key_path, tmp_cert_path, tmp_qr_path, tmp_pdf_path]:
            if tmp_file and os.path.exists(tmp_file):
                try:
                    os.remove(tmp_file)
                except Exception:
                    pass
