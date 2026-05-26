from pathlib import Path
import subprocess
import tempfile
import os


def sign_xml(xml_sin_firmar: str, nombre_certificado: str, clave_certificado: str, directorio_certificados: str = None) -> tuple:
    """
    Firma documento XML para facturación electrónica del SRI Ecuador
    usando XAdES-BES via Java
    """

    # 1. Determinar directorio de certificados
    if directorio_certificados is None:
        dir_cert = Path(__file__).parent.parent / "firmas"
    else:
        dir_cert = Path(directorio_certificados)

    ruta_certificado = dir_cert / nombre_certificado

    if not ruta_certificado.exists():
        return None, f"Certificado no encontrado: {nombre_certificado}", {"certificado": nombre_certificado, "ruta": str(ruta_certificado), "directorio": str(dir_cert), "error": "CERTIFICADO_NO_ENCONTRADO"}

    # 2. Validar XML no vacío
    if not xml_sin_firmar or not isinstance(xml_sin_firmar, str) or not xml_sin_firmar.strip():
        return None, "El XML está vacío o no es un string válido", {"error": "XML_VACIO"}

    # 3. Directorio de Java
    java_dir = Path(__file__).parent.parent / "xades_signer_java"

    # 4. Guardar XML temporal sin firmar
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix="_sin_firma.xml", mode="w", encoding="utf-8") as f:
            f.write(xml_sin_firmar)
            xml_entrada = f.name  # f.name es la ruta que tempfile.NamedTemporaryFile elige del sistema operativo (suele ser el directorio /temp) para guardar el archivo temporal

        xml_salida = xml_entrada.replace("_sin_firma.xml", "_firmado.xml")

        # 5. Ejecutar Java para firmar el XML
        cmd = [
            r"C:\Program Files\Java\jre1.8.0_441\bin\java.exe",  # Ejecutable de Java
            "-cp",  # -cp = classpath (dónde buscar las clases)
            f"{java_dir}\\build;{java_dir}\\lib\\*",  # build/ = clases compiladas ; lib/* = todos los .jar
            "com.futuresoft.comprobantes.util.FirmarXML",  # Clase principal a ejecutar
            xml_entrada,  # Argumento 1: XML sin firmar (ruta temporal)
            xml_salida,  # Argumento 2: XML firmado (ruta temporal de salida)
            str(ruta_certificado),  # Argumento 3: Ruta al certificado .p12
            clave_certificado,  # Argumento 4: Contraseña del certificado
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return None, f"Error Java: {result.stderr}", {"error": "ERROR_FIRMA_JAVA", "detalle": result.stderr}

        # 6. Leer XML firmado
        with open(xml_salida, "r", encoding="utf-8") as f:
            xml_firmado = f.read()

        # 7. Verificar firma
        if "<ds:Signature" not in xml_firmado:
            return None, "La firma no se agregó correctamente al XML", {"error": "FIRMA_NO_AGREGADA"}

        return xml_firmado, None, None

    except FileNotFoundError as e:
        return None, f"No se encontró Java o el JAR: {str(e)}", {"error": "JAVA_NO_ENCONTRADO"}
    except Exception as e:
        return None, f"Error al firmar: {str(e)}", {"error": "ERROR_FIRMA", "detalle_tecnico": str(e)}
    finally:
        # Limpiar archivos temporales
        if "xml_entrada" in locals() and os.path.exists(xml_entrada):
            os.unlink(xml_entrada)
        if "xml_salida" in locals() and os.path.exists(xml_salida):
            os.unlink(xml_salida)
