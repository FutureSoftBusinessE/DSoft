"""
email_service.py
Servicio de encolado de correos para documentos electrónicos.
Usa la misma conexión y transacción que el endpoint que lo invoca.
NO envía correos directamente. El worker se encarga de eso.

Aplica para: Facturas, Guías de Remisión, Notas de Crédito,
             Notas de Débito, Retenciones y cualquier otro
             documento electrónico.
"""

from datetime import datetime
from sqlalchemy import text


def encolar_envio_correo_docelectronico(connection, ciacodigo, facnumfac, loccodigo, datos_correo, usrcodigo, ip_usuario):
    """
    Inserta o resetea una tarea de envío de correo en la cola
    (tabla siacdocelectronicoscorreo).
    Usa la connection existente (misma transacción del endpoint).

    Parámetros:
        connection: Conexión activa de SQLAlchemy (ya dentro de una transacción)
        ciacodigo (str): Código de la empresa
        facnumfac (str): Número del documento electrónico (factura, guía, etc.)
        loccodigo (str): Código de la localidad
        datos_correo (dict): Datos del correo desde el payload SRI:
            - smtp_host: Servidor SMTP
            - puerto: Puerto SMTP
            - email_salida: Correo remitente
            - clave_email: Contraseña SMTP
            - destinatario: Email del cliente
            - asunto: Subject del correo
            - mensaje: Cuerpo HTML del correo
        usrcodigo (str): Usuario que generó el documento
        ip_usuario (str): IP del usuario

    Retorna:
        bool: True si se encoló correctamente

    El worker_email.py recogerá esta tarea y:
        1. Leerá el PDF de siacdocelectronicos
        2. Leerá los datos SMTP desde esta misma tabla
        3. Enviará el correo con el PDF adjunto
        4. Actualizará emstatus a 'A' (enviado) o 'E' (error)
    """

    # Extraer datos del correo del payload
    emdestinatario = datos_correo.get("destinatario", "")
    emsmtpusuario = datos_correo.get("email_salida", "")
    emsmtphost = datos_correo.get("smtp_host", "")
    emsmtppuerto = datos_correo.get("puerto", "")
    emsmtppassword = datos_correo.get("clave_email", "")
    emasunto = datos_correo.get("asunto", "")
    emmensaje = datos_correo.get("mensaje", "")

    # Fechas del sistema
    fecha_actual = datetime.now()
    fecha_con_hora_cero = fecha_actual.replace(hour=0, minute=0, second=0, microsecond=0)
    fecha_formato_1900 = datetime(1900, 1, 1, fecha_actual.hour, fecha_actual.minute, fecha_actual.second)

    # Verificar si ya existe un registro para este documento Y destinatario
    # Si existe → Reintento manual, se resetea a pendiente
    # Si no existe → Primera vez, se inserta
    query_existente = """
        SELECT COUNT(*) as cantidad
        FROM siacdocelectronicoscorreo
        WHERE ciacodigo = :ciacodigo
          AND facnumfac = :facnumfac
          AND loccodigo = :loccodigo
          AND emdestinatario = :emdestinatario
    """
    resultado = connection.execute(text(query_existente), {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo, "emdestinatario": emdestinatario}).mappings().first()

    if resultado["cantidad"] > 0:
        # Ya existe → Reintento manual
        # Resetear a estado pendiente con intentos en cero
        connection.execute(
            text(
                """
                UPDATE siacdocelectronicoscorreo
                SET emsmtpusuario = :emsmtpusuario,
                    emsmtphost = :emsmtphost,
                    emsmtppuerto = :emsmtppuerto,
                    emsmtppassword = :emsmtppassword,
                    emasunto = :emasunto,
                    emmensaje = :emmensaje,
                    emstatus = 'P',
                    emintentos = 0,
                    emerrordetalle = NULL,
                    emfechaenvio = NULL,
                    emproxreintentofec = NULL,
                    emproxreintentohor = NULL,
                    emfecmsys = :fecha,
                    emhormsys = :hora,
                    emusumsys = :usuario,
                    emestmsys = :ip
                WHERE ciacodigo = :ciacodigo
                  AND facnumfac = :facnumfac
                  AND loccodigo = :loccodigo
                  AND emdestinatario = :emdestinatario
            """
            ),
            {
                "emsmtpusuario": emsmtpusuario,
                "emsmtphost": emsmtphost,
                "emsmtppuerto": emsmtppuerto,
                "emsmtppassword": emsmtppassword,
                "emasunto": emasunto,
                "emmensaje": emmensaje,
                "fecha": fecha_con_hora_cero,
                "hora": fecha_formato_1900,
                "usuario": usrcodigo,
                "ip": ip_usuario,
                "ciacodigo": ciacodigo,
                "facnumfac": facnumfac,
                "loccodigo": loccodigo,
                "emdestinatario": emdestinatario,
            },
        )
    else:
        # No existe → Primera emisión del documento para este destinatario
        connection.execute(
            text(
                """
                INSERT INTO siacdocelectronicoscorreo (
                    ciacodigo, facnumfac, loccodigo,
                    emdestinatario,
                    emsmtpusuario,
                    emsmtphost,
                    emsmtppuerto,
                    emsmtppassword,
                    emasunto,
                    emmensaje,
                    emstatus,
                    emintentos,
                    emerrordetalle,
                    emfechaenvio,
                    emproxreintentofec,
                    emproxreintentohor,
                    emfecisys, emhorisys, emusuisys, emestisys,
                    emfecmsys, emhormsys, emusumsys, emestmsys
                ) VALUES (
                    :ciacodigo, :facnumfac, :loccodigo,
                    :emdestinatario,
                    :emsmtpusuario,
                    :emsmtphost,
                    :emsmtppuerto,
                    :emsmtppassword,
                    :emasunto,
                    :emmensaje,
                    'P',
                    0,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    :fecha, :hora, :usuario, :ip,
                    :fecha, :hora, :usuario, :ip
                )
            """
            ),
            {
                "ciacodigo": ciacodigo,
                "facnumfac": facnumfac,
                "loccodigo": loccodigo,
                "emdestinatario": emdestinatario,
                "emsmtpusuario": emsmtpusuario,
                "emsmtphost": emsmtphost,
                "emsmtppuerto": emsmtppuerto,
                "emsmtppassword": emsmtppassword,
                "emasunto": emasunto,
                "emmensaje": emmensaje,
                "fecha": fecha_con_hora_cero,
                "hora": fecha_formato_1900,
                "usuario": usrcodigo,
                "ip": ip_usuario,
            },
        )

    return True


def obtener_estado_envio(connection, ciacodigo, facnumfac, loccodigo, emdestinatario=None):
    """
    Consulta el estado de envío del correo de un documento electrónico.
    Útil para el frontend (mostrar si se envió, falló, etc.).
    Usa la connection existente.

    Parámetros:
        connection: Conexión activa de SQLAlchemy
        ciacodigo (str): Código de la empresa
        facnumfac (str): Número del documento electrónico
        loccodigo (str): Código de la localidad
        emdestinatario (str, opcional): Email del destinatario.
            Si no se especifica, devuelve todos los registros del documento.

    Retorna:
        list[dict] o dict: Datos del estado del envío o None si no existe
    """
    if emdestinatario:
        # Buscar un destinatario específico
        resultado = (
            connection.execute(
                text(
                    """
                SELECT emdestinatario, emstatus, emintentos, emerrordetalle,
                       emfechaenvio, emproxreintentofec, emproxreintentohor
                FROM siacdocelectronicoscorreo
                WHERE ciacodigo = :ciacodigo
                  AND facnumfac = :facnumfac
                  AND loccodigo = :loccodigo
                  AND emdestinatario = :emdestinatario
            """
                ),
                {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo, "emdestinatario": emdestinatario},
            )
            .mappings()
            .first()
        )

        if resultado:
            return dict(resultado)
        return None
    else:
        # Buscar todos los destinatarios del documento
        resultados = (
            connection.execute(
                text(
                    """
                SELECT emdestinatario, emstatus, emintentos, emerrordetalle,
                       emfechaenvio, emproxreintentofec, emproxreintentohor
                FROM siacdocelectronicoscorreo
                WHERE ciacodigo = :ciacodigo
                  AND facnumfac = :facnumfac
                  AND loccodigo = :loccodigo
                ORDER BY emdestinatario
            """
                ),
                {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo},
            )
            .mappings()
            .all()
        )

        if resultados:
            return [dict(r) for r in resultados]
        return []
