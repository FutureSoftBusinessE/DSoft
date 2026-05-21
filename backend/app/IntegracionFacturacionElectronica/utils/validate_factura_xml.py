import xmlschema
from lxml import etree
from pathlib import Path


def validate_factura_xml(xml_string, xsd_path=None):
    """
    Valida un XML de factura electrónica SOLO contra el XSD del SRI

    Args:
        xml_string: String con el XML generado
        xsd_path: Ruta al archivo XSD (opcional)

    Returns:
        tuple: (es_valido, mensaje)
    """
    if xsd_path is None:
        # Obtener la ruta del xds de la factura_V1.1.0
        base_dir = Path(__file__).resolve().parent.parent
        xsd_path = base_dir / "models" / "factura" / "factura_V1.1.0.xsd"

    # Convertir a Path si es string
    xsd_path = Path(xsd_path).resolve()

    try:
        # 1. Validar que sea XML bien formado
        etree.fromstring(xml_string.encode("utf-8"))

        # 2. Validar contra XSD del SRI
        schema = xmlschema.XMLSchema(str(xsd_path))
        schema.validate(xml_string)

        return True, "XML válido según XSD del SRI"

    except etree.XMLSyntaxError as e:
        return False, f"XML mal formado: {str(e)}"
    except Exception as e:
        return False, f"No cumple XSD del SRI: {str(e)}"
