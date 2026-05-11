from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required
# Importamos PdfFileReader en lugar del Writer para una validación segura
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature
from error_handling import api_endpoint, ValidationError
from app.FirmarPDFDF import bp
import re

def formatear_fecha_pdf(fecha_pdf):
    if not fecha_pdf: return "N/A"
    try:
        if isinstance(fecha_pdf, bytes):
            fecha_pdf = fecha_pdf.decode('utf-8', 'ignore')
        fecha_str = str(fecha_pdf).replace("D:", "").replace("'", "")
        # Parsear estándar PDF: YYYYMMDDHHMMSS
        match = re.search(r'(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})', fecha_str)
        if match:
            return f"{match.group(1)}-{match.group(2)}-{match.group(3)}\n{match.group(4)}:{match.group(5)}:{match.group(6)}"
        return str(fecha_pdf)
    except:
        return "N/A"

def decodificar_texto_pdf(texto):
    if not texto: return "null"
    try:
        if isinstance(texto, bytes):
            if texto.startswith(b'\xfe\xff'): 
                return texto.decode('utf-16')
            return texto.decode('utf-8', 'ignore')
        return str(texto)
    except:
        return "null"

@bp.route("/verificarFirmaPDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def verificarFirmaPDF():
    pdf_file = request.files.get("documento")

    if not pdf_file:
        raise ValidationError("Debe cargar un archivo PDF para validar.")

    try:
        # SOLUCIÓN AL ERROR HYBRID-REFERENCE: 
        # Usamos PdfFileReader con strict=False para tolerar el formato
        r = PdfFileReader(pdf_file, strict=False)
        firmas_encontradas = []

        # En PdfFileReader se usa directamente 'embedded_signatures'
        for sig in r.embedded_signatures:
            status = validate_pdf_signature(sig)
            cert = sig.signer_cert
            
            # Navegar atributos nativos del certificado
            subject_dict = cert.subject.native
            issuer_dict = cert.issuer.native

            nombres = subject_dict.get('common_name', subject_dict.get('description', 'Desconocido'))
            cedula = subject_dict.get('serial_number', '') 

            entidad = issuer_dict.get('organization_name', issuer_dict.get('common_name', 'Desconocida'))

            emision = cert.not_valid_before.strftime('%Y-%m-%d\n%H:%M:%S')
            expiracion = cert.not_valid_after.strftime('%Y-%m-%d\n%H:%M:%S')

            pdf_dict = sig.sig_object
            reason = decodificar_texto_pdf(pdf_dict.get('/Reason'))
            location = decodificar_texto_pdf(pdf_dict.get('/Location'))
            fecha_firma = formatear_fecha_pdf(pdf_dict.get('/M'))
            
            firmas_encontradas.append({
                "nombres": f"{cedula}\n{nombres}".strip(),
                "razon_loc": f"{reason}\n{location}".strip(),
                "fecha_firmado": f"{fecha_firma}\nhora de Ecuador",
                "entidad": entidad,
                "emision": f"{emision}\nhora de Ecuador",
                "expiracion": f"{expiracion}\nhora de Ecuador",
                "revocacion": "No revocado",
                "sellado": "No", 
                "valido": status.valid and status.intact
            })

        return {
            "valido": len(firmas_encontradas) > 0,
            "total_firmas": len(firmas_encontradas),
            "detalles": firmas_encontradas
        }

    except Exception as e:
        raise ValidationError(f"Error técnico al procesar el PDF: {str(e)}")