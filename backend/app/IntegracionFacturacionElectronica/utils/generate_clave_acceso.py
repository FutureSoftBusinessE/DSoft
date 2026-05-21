# app/IntegracionFacturacionElectronica/utils/generar_clave_acceso.py

from datetime import datetime
from typing import Tuple


def generate_clave_acceso(fecha_emision: str, cod_doc: str, ruc: str, ambiente: str, serie: str, secuencial: str, codigo_numerico: str, tipo_emision: str) -> Tuple[str, str, dict]:
    """
    Genera la clave de acceso de 49 dígitos según algoritmo del SRI.

    Estructura de la clave (49 dígitos):
        Fecha(8) + TipoDoc(2) + RUC(13) + Ambiente(1) + Serie(6) +
        Secuencial(9) + CodigoNumerico(8) + TipoEmision(1) + DV(1)

    Args:
        fecha_emision: Fecha en formato dd/MM/yyyy
        cod_doc: Código de documento (01=factura, 04=nota crédito, etc.)
        ruc: RUC del emisor, 13 dígitos
        ambiente: "1" para pruebas, "2" para producción
        serie: 6 dígitos (establecimiento + punto emisión)
        secuencial: 9 dígitos del comprobante
        codigo_numerico: 8 dígitos aleatorios
        tipo_emision: "1" para normal, "2" para contingencia

    Returns:
        tuple: (clave_acceso, mensaje_error, detalles_error)
            - OK: ("clave49digitos", None, None)
            - Error: (None, "mensaje", {"error": "...", ...})
    """

    # Validar y convertir fecha de dd/MM/yyyy a ddmmaaaa
    try:
        fecha_dt = datetime.strptime(fecha_emision, "%d/%m/%Y")
        fecha_str = fecha_dt.strftime("%d%m%Y")
    except ValueError:
        return None, f"Formato de fecha inválido: {fecha_emision}", {"fecha": fecha_emision, "formato_esperado": "dd/MM/yyyy", "error": "FECHA_INVALIDA"}
    except Exception as e:
        return None, f"Error al procesar fecha: {str(e)}", {"fecha": fecha_emision, "error": "ERROR_PROCESANDO_FECHA"}

    # Validar código de documento (2 dígitos numéricos)
    if not cod_doc or not cod_doc.isdigit() or len(cod_doc) != 2:
        return None, f"Código de documento inválido: {cod_doc}", {"cod_doc": cod_doc, "formato_esperado": "2 dígitos numéricos", "error": "COD_DOC_INVALIDO"}

    # Validar RUC (13 dígitos numéricos)
    ruc = ruc.strip()
    if not ruc or not ruc.isdigit() or len(ruc) != 13:
        return None, f"RUC inválido: {ruc}", {"ruc": ruc, "formato_esperado": "13 dígitos numéricos", "error": "RUC_INVALIDO"}

    # Validar ambiente (1 o 2)
    if ambiente not in ["1", "2"]:
        return None, f"Ambiente inválido: {ambiente}", {"ambiente": ambiente, "valores_permitidos": ["1", "2"], "error": "AMBIENTE_INVALIDO"}

    # Validar serie (6 dígitos numéricos)
    serie = serie.strip().zfill(6)
    if len(serie) != 6 or not serie.isdigit():
        return None, f"Serie inválida: {serie}", {"serie": serie, "formato_esperado": "6 dígitos numéricos", "error": "SERIE_INVALIDA"}

    # Validar secuencial (9 dígitos numéricos)
    secuencial = secuencial.strip().zfill(9)
    if len(secuencial) != 9 or not secuencial.isdigit():
        return None, f"Secuencial inválido: {secuencial}", {"secuencial": secuencial, "formato_esperado": "9 dígitos numéricos", "error": "SECUENCIAL_INVALIDO"}

    # Validar código numérico (8 dígitos numéricos)
    codigo_numerico = codigo_numerico.strip().zfill(8)
    if len(codigo_numerico) != 8 or not codigo_numerico.isdigit():
        return None, f"Código numérico inválido: {codigo_numerico}", {"codigo_numerico": codigo_numerico, "formato_esperado": "8 dígitos numéricos", "error": "CODIGO_NUMERICO_INVALIDO"}

    # Validar tipo de emisión (1 o 2)
    if tipo_emision not in ["1", "2"]:
        return None, f"Tipo de emisión inválido: {tipo_emision}", {"tipo_emision": tipo_emision, "valores_permitidos": ["1", "2"], "error": "TIPO_EMISION_INVALIDO"}

    # Construir los primeros 48 dígitos de la clave
    clave_sin_dv = fecha_str + cod_doc + ruc + ambiente + serie + secuencial + codigo_numerico + tipo_emision

    # Validar longitud antes del dígito verificador
    if len(clave_sin_dv) != 48:
        return None, f"La clave sin DV debe tener 48 dígitos, tiene {len(clave_sin_dv)}", {"longitud_actual": len(clave_sin_dv), "longitud_esperada": 48, "error": "LONGITUD_INVALIDA"}

    # Calcular dígito verificador
    dv = _modulo11_factor_ponderado2(clave_sin_dv)

    # Construir clave final de 49 dígitos
    clave_acceso = clave_sin_dv + str(dv)

    # Validación final
    if len(clave_acceso) != 49:
        return None, f"La clave de acceso debe tener 49 dígitos, tiene {len(clave_acceso)}", {"longitud_actual": len(clave_acceso), "longitud_esperada": 49, "error": "LONGITUD_FINAL_INVALIDA"}

    return clave_acceso, None, None


def _modulo11_factor_ponderado2(cadena_48: str) -> int:
    """
    Calcula el dígito verificador usando Módulo 11 Factor Ponderado 2.

    Algoritmo:
    1. Recorrer la cadena de derecha a izquierda
    2. Multiplicar cada dígito por 2,3,4,5,6,7 (cíclico)
    3. Sumar todos los productos
    4. resultado = 11 - (suma MOD 11)
    5. Si resultado == 11: devolver 0
       Si resultado == 10: devolver 1
       Otro caso: devolver resultado

    Args:
        cadena_48: String de 48 dígitos numéricos

    Returns:
        int: Dígito verificador (0-9)
    """

    multiplicadores = [2, 3, 4, 5, 6, 7]
    suma_total = 0
    idx = 0

    # Recorrer de derecha a izquierda
    for i in range(len(cadena_48) - 1, -1, -1):
        digito = int(cadena_48[i])
        suma_total += digito * multiplicadores[idx]
        idx += 1
        if idx >= len(multiplicadores):
            idx = 0

    # Calcular dígito verificador
    resultado = 11 - (suma_total % 11)

    # Ajustes especiales
    if resultado == 11:
        return 0
    elif resultado == 10:
        return 1
    else:
        return resultado
