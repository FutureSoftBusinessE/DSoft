import json
from lxml import etree
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PrivateFormat, NoEncryption
from cryptography.hazmat.backends import default_backend
from signxml.xades import XAdESSigner
from sqlalchemy import text
from flask_jwt_extended import get_jwt
from app.db import get_session
from services.encrip_desencrip import desencriptar


def sign_xml(xml_sin_firmar: str, *args, **kwargs) -> tuple:
    """
    Firma documento XML para facturación electrónica del SRI Ecuador.
    Versión blindada: SHA-256 + Canonicalización SRI + Puntero URI Explícito.
    """
    try:
        if not xml_sin_firmar:
            return None, "XML vacío", {"error": "XML_VACIO"}

        claims = get_jwt()
        db_session = get_session(claims["seleccion"]["clicianonBD"])

        with db_session.bind.connect() as conn:
            locpathxml = conn.execute(text("SELECT locpathxml FROM cgblocal WHERE ciacodigo = :cia"), {"cia": claims["seleccion"]["cliciaciacodigo"]}).scalar()
            res = conn.execute(text("SELECT COALESCE(d.documento, o.documento), COALESCE(d.doc_datos_sensibles, o.doc_datos_sensibles) FROM gdocmdocumentos d LEFT JOIN gdocmdocumentos o ON d.documento_origen_uuid = o.documentouuid WHERE d.documentouuid = :uuid"), {"uuid": locpathxml}).first()

            p12_bytes, datos_sensibles = res[0], res[1].decode("utf-8").strip()
            # Limpiamos cualquier padding residual de la base de datos
            while datos_sensibles and ord(datos_sensibles[-1]) < 32:
                datos_sensibles = datos_sensibles[:-1]

            clave_p12 = json.loads(desencriptar(datos_sensibles)).get("clave_certificado", "")

        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(p12_bytes, clave_p12.encode("utf-8"), default_backend())

        key_pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
        cert_pem = certificate.public_bytes(Encoding.PEM)

        # Parsear eliminando todo espacio en blanco que pueda romper el Hash
        parser = etree.XMLParser(remove_blank_text=True)
        xml_root = etree.fromstring(xml_sin_firmar.encode("utf-8"), parser)

        # Garantizar que el nodo raíz tenga el ID exacto
        xml_root.set("id", "comprobante")

        # Usamos SHA-256 (Seguridad Moderna) con Canonicalización 1.0 (Regla SRI)
        signer = XAdESSigner(signature_algorithm="rsa-sha256", digest_algorithm="sha256", c14n_algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315")

        # --- EL SECRETO DEL SRI ---
        # Le decimos a la librería que apunte la firma estrictamente al id="comprobante"
        xml_firmado_root = signer.sign(xml_root, key=key_pem, cert=cert_pem, reference_uri="#comprobante")

        xml_final = etree.tostring(xml_firmado_root, encoding="UTF-8", method="xml", xml_declaration=True)
        return xml_final.decode("utf-8"), None, None

    except Exception as e:
        return None, str(e), {"error": "ERROR_FIRMA_PYTHON"}
