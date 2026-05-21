import base64
from zeep import Client, Settings
from zeep.exceptions import Fault, TransportError

# URLs de los servicios SRI
ENVIRONMENTS = {
    "1": {  # Pruebas
        "receipt": "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
        "authorization": "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
    },
    "2": {  # Producción
        "receipt": "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
        "authorization": "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
    },
}


def send_receipt(xml_firmado: str, ambiente: str) -> tuple:
    """
    Envía el XML firmado al servicio de recepción del SRI.

    Args:
        xml_firmado: String con el XML firmado
        ambiente: "1" para pruebas, "2" para producción

    Returns:
        tuple: (response, error_msg, error_details)
            - OK: (response_obj, None, None)
            - Error: (None, "mensaje", {"detalle": ...})
    """

    # Validar ambiente
    if ambiente not in ENVIRONMENTS:
        return None, f"Ambiente inválido: {ambiente}", {"ambiente": ambiente, "valores_permitidos": ["1", "2"], "error": "AMBIENTE_INVALIDO"}

    try:
        # Convertir XML a base64
        xml_base64 = base64.b64encode(xml_firmado.encode("utf-8")).decode("utf-8")

        # Conectar al servicio
        client = Client(wsdl=ENVIRONMENTS[ambiente]["receipt"], settings=Settings(strict=False, xml_huge_tree=True))

        # Enviar validación
        response = client.service.validarComprobante(xml=xml_base64)

        # Validar respuesta del SRI
        if response is not None:
            estado = getattr(response, "estado", None)

            # Si el estado es DEVUELTA, extraer mensajes de error
            if estado == "DEVUELTA":
                mensajes_error = []

                if hasattr(response, "comprobantes") and hasattr(response.comprobantes, "comprobante"):
                    comprobantes = response.comprobantes.comprobante
                    if not isinstance(comprobantes, list):
                        comprobantes = [comprobantes]

                    for comp in comprobantes:
                        if hasattr(comp, "mensajes") and hasattr(comp.mensajes, "mensaje"):
                            msgs = comp.mensajes.mensaje
                            if not isinstance(msgs, list):
                                msgs = [msgs]
                            for msg in msgs:
                                mensajes_error.append({"identificador": getattr(msg, "identificador", ""), "mensaje": getattr(msg, "mensaje", ""), "informacionAdicional": getattr(msg, "informacionAdicional", ""), "tipo": getattr(msg, "tipo", "")})

                return None, "Comprobante DEVUELTO por el SRI", {"estado": estado, "mensajes": mensajes_error, "error": "COMPROBANTE_DEVUELTO"}

        return response, None, None
    except Fault as fault:
        return None, f"Error SOAP del SRI: {fault}", {"error": "FAULT_SOAP", "detalle": str(fault)}
    except TransportError as te:
        return None, f"Error de conexión con el SRI: {te}", {"error": "ERROR_TRANSPORTE", "detalle": str(te)}
    except Exception as e:
        return None, f"Error inesperado en recepción: {str(e)}", {"error": "ERROR_RECEPCION", "detalle_tecnico": str(e)}


def send_authorization(clave_acceso: str, ambiente: str) -> tuple:
    """
    Consulta la autorización de un comprobante en el SRI.

    Args:
        clave_acceso: Clave de acceso de 49 dígitos
        ambiente: "1" para pruebas, "2" para producción

    Returns:
        tuple: (response, error_msg, error_details)
            - OK: (response_obj, None, None)
            - Error: (None, "mensaje", {"detalle": ...})
    """

    # Validar ambiente
    if ambiente not in ENVIRONMENTS:
        return None, f"Ambiente inválido: {ambiente}", {"ambiente": ambiente, "valores_permitidos": ["1", "2"], "error": "AMBIENTE_INVALIDO"}

    # Validar clave de acceso
    if not clave_acceso or len(clave_acceso) != 49:
        return None, f"Clave de acceso inválida (debe tener 49 dígitos): {clave_acceso}", {"clave_acceso": clave_acceso, "longitud": len(clave_acceso) if clave_acceso else 0, "error": "CLAVE_ACCESO_INVALIDA"}

    try:
        # Conectar al servicio
        client = Client(wsdl=ENVIRONMENTS[ambiente]["authorization"], settings=Settings(strict=False, xml_huge_tree=True))

        # Consultar autorización
        response = client.service.autorizacionComprobante(claveAccesoComprobante=clave_acceso)

        return response, None, None

    except Fault as fault:
        return None, f"Error SOAP del SRI: {fault}", {"error": "FAULT_SOAP", "detalle": str(fault)}
    except TransportError as te:
        return None, f"Error de conexión con el SRI: {te}", {"error": "ERROR_TRANSPORTE", "detalle": str(te)}
    except Exception as e:
        return None, f"Error inesperado en autorización: {str(e)}", {"error": "ERROR_AUTORIZACION", "detalle_tecnico": str(e)}


def parse_authorization_response(response) -> dict:
    """
    Parsea la respuesta de autorización del SRI y extrae datos relevantes.

    Args:
        response: Respuesta del servicio de autorización

    Returns:
        dict: {
            "estado": "AUTORIZADO" | "NO AUTORIZADO" | etc.,
            "numero_autorizacion": "1234567890" o None,
            "fecha_autorizacion": datetime o None,
            "ambiente": "PRUEBAS" | "PRODUCCION",
            "comprobante": "xml string" o None,
            "mensajes": [{"identificador": "XX", "mensaje": "...", "tipo": "ERROR"}] o []
        }
    """

    result = {"estado": None, "numero_autorizacion": None, "fecha_autorizacion": None, "ambiente": None, "comprobante": None, "mensajes": []}

    try:
        autorizaciones = []
        if hasattr(response, "autorizaciones"):
            auth_container = response.autorizaciones
            if hasattr(auth_container, "autorizacion"):
                auth_list = auth_container.autorizacion
                if not isinstance(auth_list, list):
                    auth_list = [auth_list]
                autorizaciones = auth_list

        for auth in autorizaciones:
            result["estado"] = getattr(auth, "estado", None)
            result["numero_autorizacion"] = getattr(auth, "numeroAutorizacion", None)
            result["fecha_autorizacion"] = getattr(auth, "fechaAutorizacion", None)
            result["ambiente"] = getattr(auth, "ambiente", None)
            result["comprobante"] = getattr(auth, "comprobante", None)

            mensajes = getattr(auth, "mensajes", None)
            if mensajes and hasattr(mensajes, "mensaje"):
                msgs = mensajes.mensaje
                if not isinstance(msgs, list):
                    msgs = [msgs]
                for msg in msgs:
                    result["mensajes"].append({"identificador": getattr(msg, "identificador", ""), "mensaje": getattr(msg, "mensaje", ""), "tipo": getattr(msg, "tipo", "")})

    except Exception as e:
        result["mensajes"].append({"identificador": "PARSE_ERROR", "mensaje": f"Error al parsear respuesta: {str(e)}", "tipo": "ERROR"})

    return result


def build_autorizacion_xml(auth_data: dict, clave_acceso: str) -> str:
    """
    Construye el XML de autorización en formato SRI.

    Args:
        auth_data: Datos parseados de la respuesta de autorización
        clave_acceso: Clave de acceso del comprobante

    Returns:
        str: XML de autorización formateado
    """

    estado = auth_data.get("estado", "")
    numero_autorizacion = auth_data.get("numero_autorizacion", "")
    ambiente = auth_data.get("ambiente", "")
    comprobante = auth_data.get("comprobante", "")
    mensajes_list = auth_data.get("mensajes", [])

    # Formatear fecha
    fecha_auth = auth_data.get("fecha_autorizacion")
    if hasattr(fecha_auth, "strftime"):
        fecha_str = fecha_auth.strftime("%d/%m/%Y %H:%M:%S")
    elif isinstance(fecha_auth, str):
        fecha_str = fecha_auth
    else:
        fecha_str = ""

    # Formatear mensajes
    mensajes_str = ""
    for msg in mensajes_list:
        mensajes_str += f'<mensaje>\n<identificador>{msg.get("identificador", "")}</identificador>\n<mensaje>{msg.get("mensaje", "")}</mensaje>\n<informacionAdicional>{msg.get("informacionAdicional", "")}</informacionAdicional>\n<tipo>{msg.get("tipo", "")}</tipo>\n</mensaje>\n'

    # Construir XML
    xml = f"""<autorizacion>
        <estado>{estado}</estado>
        <numeroAutorizacion>{numero_autorizacion}</numeroAutorizacion>
        <fechaAutorizacion>{fecha_str}</fechaAutorizacion>
        <ambiente>{ambiente}</ambiente>
        <comprobante><![CDATA[ {comprobante} ]]></comprobante>
        <mensajes>{mensajes_str.strip()}</mensajes>
    </autorizacion>"""

    return xml
