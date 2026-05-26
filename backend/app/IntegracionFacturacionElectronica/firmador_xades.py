import base64
from datetime import datetime, timezone
from lxml import etree
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend
from endesive.xades import XADES_BES


def firmar_xml_sri(xml_string: str, p12_bytes: bytes, p12_password: str) -> str:
    """
    Reemplazo 100% Python de la librería MITyC de Java.
    Aplica una firma XAdES-BES Enveloped válida para el SRI de Ecuador.
    """
    try:
        # 1. Cargar el certificado P12 y la llave privada desde los bytes en memoria
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(p12_bytes, p12_password.encode("utf-8"), default_backend())
        # 2. Parsear el XML que viene de 'build_xml_desde_factura'
        # Usamos lxml para asegurar que el XML se procese sin espacios basuras
        parser = etree.XMLParser(remove_blank_text=True)
        xml_root = etree.fromstring(xml_string.encode("utf-8"), parser)

        # El SRI exige que la raíz tenga un ID para referenciar la firma (ej. id="comprobante")
        # Aseguramos que la etiqueta raíz (factura, notaCredito, etc.) tenga id="comprobante"
        if "id" not in xml_root.attrib:
            xml_root.set("id", "comprobante")
        elif xml_root.attrib["id"] != "comprobante":
            # Guardamos el ID original si se necesita, pero forzamos 'comprobante' para la firma
            xml_root.set("id", "comprobante")

        xml_bytes_limpio = etree.tostring(xml_root, encoding="UTF-8", method="xml", xml_declaration=True)

        # 3. Preparar el motor XAdES-BES de 'endesive'
        # El SRI valida usando SHA1 o SHA256 (Actualmente se exige SHA256)
        cls = XADES_BES()

        # 4. Generar la Firma (Enveloped)
        # Esto crea los nodos <ds:Signature>, <xades:SignedProperties>, etc.
        xml_firmado_bytes = cls.sign(
            xml_bytes_limpio,
            private_key,
            certificate,
            additional_certificates,
            # Hash requerido por el SRI
            "sha256",
        )

        # Retornamos el string del XML firmado, listo para enviar por SOAP
        return xml_firmado_bytes.decode("utf-8")

    except Exception as e:
        raise Exception(f"Error al firmar el XML en Python: {str(e)}")
