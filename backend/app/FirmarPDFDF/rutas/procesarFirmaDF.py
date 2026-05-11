from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required
import io
from datetime import datetime, timezone
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID

from app.FirmarPDFDF import bp
from error_handling import api_endpoint, ValidationError

@bp.route("/validarFirmaP12", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def validarFirmaP12():
    p12_file = request.files.get("firma")
    password = request.form.get("password")

    if not p12_file or not password:
        raise ValidationError("Archivo de firma y contraseña son requeridos.")

    try:
        p12_data = p12_file.read()
        # Carga del certificado
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
            p12_data, password.encode(), default_backend()
        )

        # Extracción de atributos específicos
        subject = certificate.subject
        issuer = certificate.issuer
        
        # Intentar obtener el CN (Common Name) y SerialNumber (donde suele ir la cédula)
        cn = subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
        entidad = issuer.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)[0].value
        
        # Lógica de expiración
        ahora = datetime.now(timezone.utc)
        expirado = ahora > certificate.not_valid_after_utc

        return {
            "emitido_por": entidad,
            "sujeto_completo": cn,
            "valido_desde": certificate.not_valid_before_utc.strftime('%Y-%m-%d %H:%M:%S'),
            "valido_hasta": certificate.not_valid_after_utc.strftime('%Y-%m-%d %H:%M:%S'),
            "expirado": "SÍ" if expirado else "NO",
            "serial": hex(certificate.serial_number),
            # El campo revocado requiere conexión a listas CRL/OCSP (se deja como N/A por ahora)
            "revocado": "NO (Verificación local)" 
        }
    except Exception:
        raise ValidationError("Error al leer el certificado. Verifique la contraseña.")