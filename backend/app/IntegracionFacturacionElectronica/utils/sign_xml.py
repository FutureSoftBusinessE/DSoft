import json
from lxml import etree
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PrivateFormat, NoEncryption
from cryptography.hazmat.backends import default_backend
from signxml.xades import XAdESSigner
from sqlalchemy import text
from flask_jwt_extended import get_jwt
from app.db import get_session
from services.encrip_desencrip import desencriptar


def sign_xml(xml_sin_firmar: str, p12_bytes: bytes, clave_p12: str) -> tuple:
    """
    Firma documento XML para facturación electrónica del SRI Ecuador.

    Args:
        xml_sin_firmar: XML en string sin firmar
        p12_bytes: Bytes del certificado P12
        clave_p12: Clave del certificado

    Returns:
        tuple: (xml_firmado, mensaje_error, detalles_error)
    """
    try:
        if not xml_sin_firmar:
            return None, "XML vacío", {"error": "XML_VACIO"}

        if not p12_bytes or not clave_p12:
            return None, "Credenciales del certificado no válidas", {"error": "CREDENCIALES_INVALIDAS"}

        # Cargar certificado
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(p12_bytes, clave_p12.encode("utf-8"), default_backend())

        # Convertir a PEM
        key_pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
        cert_pem = certificate.public_bytes(Encoding.PEM)

        # Parsear XML eliminando espacios en blanco
        parser = etree.XMLParser(remove_blank_text=True)
        xml_root = etree.fromstring(xml_sin_firmar.encode("utf-8"), parser)

        # Asignar ID requerido por SRI
        xml_root.set("id", "comprobante")

        # Configurar firmante con especificaciones SRI
        signer = XAdESSigner(signature_algorithm="rsa-sha256", digest_algorithm="sha256", c14n_algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315")

        # Firmar apuntando al ID del comprobante
        xml_firmado_root = signer.sign(xml_root, key=key_pem, cert=cert_pem, reference_uri="#comprobante")

        # Convertir a string
        xml_final = etree.tostring(xml_firmado_root, encoding="UTF-8", method="xml", xml_declaration=True)

        return xml_final.decode("utf-8"), None, None

    except Exception as e:
        return None, str(e), {"error": "ERROR_FIRMA_PYTHON"}
