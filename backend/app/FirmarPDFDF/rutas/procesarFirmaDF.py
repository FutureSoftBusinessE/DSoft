import json
from flask import request

from flask_jwt_extended import jwt_required, get_jwt
import io
from datetime import datetime, timezone
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID

from sqlalchemy import text
from app.db import get_session
from app.extensions import db
from services.encrip_desencrip import desencriptar

from app.FirmarPDFDF import bp
from error_handling import api_endpoint, ValidationError


@bp.route("/validarFirmaP12", methods=["POST"])
@jwt_required()
@api_endpoint
def validarFirmaP12():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    p12_file = request.files.get("firma")
    password = request.form.get("password")

    p12_data = None
    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        if not p12_file or not password:
            sql_cgb = text("SELECT locpathxml FROM cgblocal WHERE ciacodigo = :cia AND loccodigo = :loc")
            cgb_res = connection.execute(sql_cgb, {"cia": ciacodigo, "loc": loccodigo}).fetchone()
            if not cgb_res or not cgb_res[0]:
                raise ValidationError("No existe firma electrónica corporativa configurada en esta localidad.")

            sql_doc = text("SELECT documento, doc_datos_sensibles FROM gdocmdocumentos WHERE documentouuid = :uuid AND ciacodigo = :cia")
            doc_res = connection.execute(sql_doc, {"uuid": cgb_res[0], "cia": ciacodigo}).fetchone()

            if not doc_res or not doc_res[0] or not doc_res[1]:
                raise ValidationError("El archivo de firma corporativa no se encuentra o está corrupto.")

            p12_data = doc_res[0]
            try:
                sensibles_str = doc_res[1].decode("utf-8")
                sensibles_json = desencriptar(sensibles_str)
                while sensibles_json and ord(sensibles_json[-1]) < 32:
                    sensibles_json = sensibles_json[:-1]
                datos_obj = json.loads(sensibles_json)
                password = datos_obj.get("clave_certificado", "")
            except Exception:
                raise ValidationError("No se pudo descifrar la clave de la firma corporativa.")
        else:
            p12_data = p12_file.read()

    if not p12_data or not password:
        raise ValidationError("Archivo de firma y contraseña son requeridos.")

    try:
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(p12_data, password.encode(), default_backend())

        subject = certificate.subject
        issuer = certificate.issuer
        cn = subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
        entidad = issuer.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)[0].value

        ahora = datetime.now(timezone.utc)
        expirado = ahora > certificate.not_valid_after_utc

        return {
            "emitido_por": entidad,
            "sujeto_completo": cn,
            "valido_desde": certificate.not_valid_before_utc.strftime("%Y-%m-%d %H:%M:%S"),
            "valido_hasta": certificate.not_valid_after_utc.strftime("%Y-%m-%d %H:%M:%S"),
            "expirado": "SÍ" if expirado else "NO",
            "serial": hex(certificate.serial_number),
            "revocado": "NO (Verificación local)",
        }
    except Exception:
        raise ValidationError("Error al leer el certificado. Verifique la contraseña.")
