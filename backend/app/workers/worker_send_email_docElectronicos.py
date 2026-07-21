"""
worker_email.py
=================
Proceso independiente que actúa como consumidor de la cola de correos
para documentos electrónicos.

ARQUITECTURA:
    - Se conecta a DSOFT (BD maestra) para obtener la lista de empresas
    - Por cada empresa, se conecta a su BD (clicianonBD) y busca pendientes
    - Procesa cada pendiente: lee PDF y XML, lee datos SMTP de la misma tabla, envía correo, actualiza estado
    - Ya NO consulta cgblocal. Los datos SMTP viajan en el payload y se guardan en siacdocelectronicoscorreo.

EJECUCIÓN:
    - Servy (recomendado): agrega este script como otro proceso
    - Manual: python worker_email.py

ESTADOS:
    P = Pendiente (esperando ser procesado)
    A = Aprobado (enviado con éxito)
    E = Error (fallido, requiere intervención manual)

REINTENTOS:
    - Intento 1: inmediato
    - Intento 2: 30 segundos después
    - Intento 3: 2 minutos después
    - Intento 4: 10 minutos después
    - Si falla 4 veces → estado 'E' (error definitivo)
    - Reintento manual: el endpoint resetea a 'P' con intentos=0

APLICA PARA:
    Facturas, Guías de Remisión, Notas de Crédito, Notas de Débito,
    Retenciones y cualquier otro documento electrónico.
"""

import time
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime, timedelta
from sqlalchemy import text
from app.db import get_session

# =============================================================================
# CONFIGURACIÓN DEL WORKER
# =============================================================================

# Tiempo de espera entre ciclos (segundos)
# El worker recorre TODAS las empresas, procesa pendientes, y espera este tiempo
INTERVALO_CONSULTA = 5

# Número máximo de reintentos automáticos antes de marcar como error definitivo
MAX_REINTENTOS = 4

# Tiempos de espera entre reintentos (en minutos)
# Indice 0: espera entre intento 1 y 2
# Indice 1: espera entre intento 2 y 3
# Indice 2: espera entre intento 3 y 4
DELAY_REINTENTOS = [0.5, 2, 10]  # 30 seg, 2 min, 10 min


def ejecutar_worker():
    """
    Punto de entrada principal del worker.
    Loop infinito que:
        1. Obtiene todas las empresas activas desde DSOFT
        2. Por cada empresa, busca y procesa correos pendientes
        3. Espera INTERVALO_CONSULTA segundos
        4. Repite
    """
    print("[WORKER EMAIL] Iniciando worker de envío de correos...")
    print(f"[WORKER EMAIL] Intervalo de consulta: {INTERVALO_CONSULTA} segundos")
    print(f"[WORKER EMAIL] Máximo de reintentos: {MAX_REINTENTOS}")
    print(f"[WORKER EMAIL] Delays de reintento: {DELAY_REINTENTOS} minutos")
    print("-" * 60)

    while True:
        try:
            ciclo_inicio = datetime.now()
            print(f"\n----------------------------[WORKER EMAIL] Nuevo ciclo: {ciclo_inicio.strftime('%Y-%m-%d %H:%M:%S')}----------------------------")

            # Paso 1: Obtener todas las empresas activas
            empresas = obtener_empresas_activas()

            if not empresas:
                print("[WORKER EMAIL] No se encontraron empresas activas")

            total_procesados = 0
            total_enviados = 0
            total_errores = 0

            # Paso 2: Procesar cada empresa
            for empresa in empresas:
                try:
                    enviados, errores = procesar_pendientes_tenant(clicianonBD=empresa["clicianonBD"], cliciaciacodigo=empresa["cliciaciacodigo"], cliciacianombre=empresa["cliciacianombre"])
                    total_enviados += enviados
                    total_errores += errores
                    if enviados > 0 or errores > 0:
                        total_procesados += 1
                except Exception as e:
                    print(f"[WORKER EMAIL] Error procesando empresa {empresa['cliciacianombre']} " f"({empresa['clicianonBD']}): {str(e)}")

            # Resumen del ciclo
            ciclo_fin = datetime.now()
            duracion = (ciclo_fin - ciclo_inicio).total_seconds()
            if total_enviados > 0 or total_errores > 0:
                print(f"----------------------------[WORKER EMAIL] Ciclo completado en {duracion:.1f}s | " f"Empresas con actividad: {total_procesados} | " f"Enviados: {total_enviados} | Errores: {total_errores}----------------------------")

        except Exception as e:
            print(f"[WORKER EMAIL] Error crítico en ciclo principal: {str(e)}")

        # Esperar antes del siguiente ciclo
        time.sleep(INTERVALO_CONSULTA)


def obtener_empresas_activas():
    """
    Obtiene la lista de todas las empresas (tenants) desde la base maestra DSOFT.

    Retorna:
        list[dict]: Lista de empresas con cliciaciacodigo, clicianonBD, cliciacianombre
    """
    sesion = get_session("DSOFT")
    engine = sesion.bind

    with engine.connect() as connection:
        # Obtener todas las empresas de fsbsmclicia
        # Cada empresa tiene su propia base de datos (clicianonBD)
        query = """
            SELECT DISTINCT
                cliciaciacodigo,
                clicianonBD,
                cliciacianombre
            FROM fsbsmclicia
            WHERE clicianonBD IS NOT NULL
              AND clicianonBD != ''
            ORDER BY clicianonBD, cliciaciacodigo
        """
        empresas = connection.execute(text(query)).mappings().all()

        return [dict(e) for e in empresas]


def procesar_pendientes_tenant(clicianonBD, cliciaciacodigo, cliciacianombre):
    """
    Busca y procesa todos los correos pendientes de una empresa específica.
    Procesa uno por uno usando UPDATE con OUTPUT para evitar bloqueos.

    Parámetros:
        clicianonBD (str): Nombre de la base de datos del cliente
        cliciaciacodigo (str): Código de la empresa (ciacodigo)
        cliciacianombre (str): Nombre de la empresa (para logs)

    Retorna:
        tuple: (enviados: int, errores: int)
    """
    try:
        sesion = get_session(clicianonBD)
        engine = sesion.bind
    except Exception as e:
        error_msg = str(e)
        if "Adaptive Server connection failed" in error_msg or "Error de inicio de sesión" in error_msg:
            print(f"  [ADVERTENCIA] {cliciacianombre} ({clicianonBD}): " f"BD no accesible. La empresa podría estar en otro servidor.")
        else:
            print(f"  [ADVERTENCIA] {cliciacianombre} ({clicianonBD}): " f"No se pudo conectar a la BD. Error: {error_msg[:100]}")
        return 0, 0

    enviados = 0
    errores = 0

    with engine.connect() as connection:
        ahora = datetime.now()
        fecha_actual = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
        hora_actual = datetime(1900, 1, 1, ahora.hour, ahora.minute, ahora.second)

        # Procesar de a uno para evitar problemas de transacción
        while True:
            with connection.begin() as trans:
                # Agarrar UN solo pendiente con UPDATE + OUTPUT
                # Esto bloquea el registro y evita que otro worker lo tome
                query_tomar_pendiente = """
                    UPDATE TOP(1) siacdocelectronicoscorreo
                    SET emstatus = 'P'
                    OUTPUT INSERTED.ciacodigo, INSERTED.facnumfac, INSERTED.loccodigo,
                           INSERTED.emdestinatario, INSERTED.emintentos,
                           INSERTED.emsmtpusuario, INSERTED.emsmtphost,
                           INSERTED.emsmtppuerto, INSERTED.emsmtppassword,
                           INSERTED.emasunto, INSERTED.emmensaje
                    WHERE emstatus = 'P'
                      AND (emproxreintentofec IS NULL
                           OR emproxreintentofec < :fecha_actual
                           OR (emproxreintentofec = :fecha_actual
                               AND emproxreintentohor <= :hora_actual))
                """
                try:
                    pendiente = connection.execute(text(query_tomar_pendiente), {"fecha_actual": fecha_actual, "hora_actual": hora_actual}).mappings().first()
                except Exception as e:
                    error_msg = str(e)
                    if "Invalid object name" in error_msg and "siacdocelectronicoscorreo" in error_msg:
                        print(f"  [INFO] {cliciacianombre} ({clicianonBD}): " f"Tabla siacdocelectronicoscorreo aún no existe.")
                    else:
                        print(f"  [ADVERTENCIA] {cliciacianombre}: Error consultando: {error_msg[:100]}")
                    return enviados, errores

                if pendiente is None:
                    # No hay más pendientes
                    trans.rollback()
                    break

                # Procesar el envío
                try:
                    exito = procesar_envio_individual(connection=connection, pendiente=pendiente)
                    if exito:
                        enviados += 1
                    else:
                        errores += 1
                except Exception as e:
                    print(f"  [{cliciacianombre}] Error procesando {pendiente['facnumfac']}: {str(e)}")
                    errores += 1

    return enviados, errores


def procesar_envio_individual(connection, pendiente):
    """
    Procesa el envío de un solo correo electrónico.

    Flujo:
        1. Obtener el PDF y XML autorizado desde siacdocelectronicos
        2. Leer los datos SMTP desde el mismo registro (ya no de cgblocal)
        3. Construir el correo con el PDF y XML adjuntos
        4. Enviar vía SMTP
        5. Actualizar estado según resultado

    Parámetros:
        connection: Conexión activa a la BD del cliente (ya en transacción)
        pendiente (dict): Registro completo de siacdocelectronicoscorreo con:
            - ciacodigo, facnumfac, loccodigo
            - emdestinatario, emintentos
            - emsmtpusuario, emsmtphost, emsmtppuerto, emsmtppassword
            - emasunto, emmensaje

    Retorna:
        bool: True si se envió correctamente, False si falló
    """

    ciacodigo = pendiente["ciacodigo"]
    facnumfac = pendiente["facnumfac"]
    loccodigo = pendiente["loccodigo"]
    emdestinatario = pendiente["emdestinatario"]
    emintentos = pendiente["emintentos"]

    # Paso 1: Obtener el PDF (RIDE) y XML autorizado desde siacdocelectronicos
    pdf_content, xml_content = obtener_archivos(connection, ciacodigo, facnumfac, loccodigo)
    if pdf_content is None:
        marcar_error(connection, ciacodigo, facnumfac, loccodigo, emdestinatario, "No se encontró el PDF en siacdocelectronicos")
        return False

    # Paso 2: Leer datos SMTP desde el mismo registro
    smtp_usuario = pendiente.get("emsmtpusuario", "")
    smtp_host = pendiente.get("emsmtphost", "")
    smtp_puerto = pendiente.get("emsmtppuerto", "587")
    smtp_password = pendiente.get("emsmtppassword", "")
    asunto = pendiente.get("emasunto", "Documento Electrónico")
    mensaje = pendiente.get("emmensaje", "Adjuntamos su documento electrónico.")

    # Validar que la configuración SMTP tenga los campos mínimos
    if not smtp_host or not smtp_usuario:
        marcar_error(connection, ciacodigo, facnumfac, loccodigo, emdestinatario, "Configuración SMTP incompleta: falta servidor o remitente")
        return False

    # Personalizar asunto con el número de documento
    asunto = f"{asunto} {facnumfac}"

    # Paso 3: Enviar el correo con PDF y XML adjuntos
    exito, mensaje_error = enviar_correo_smtp(
        smtp_host=smtp_host, smtp_puerto=smtp_puerto, smtp_usuario=smtp_usuario, smtp_password=smtp_password, remitente=smtp_usuario, destinatario=emdestinatario, asunto=asunto, mensaje=mensaje, pdf_content=pdf_content, xml_content=xml_content, facnumfac=facnumfac
    )

    # Paso 4: Actualizar estado según resultado
    if exito:
        marcar_aprobado(connection, ciacodigo, facnumfac, loccodigo, emdestinatario)
        print(f"    ✓ {facnumfac} enviado a {emdestinatario}")
        return True
    else:
        nuevo_intento = emintentos + 1

        if nuevo_intento < MAX_REINTENTOS:
            indice_delay = min(nuevo_intento - 1, len(DELAY_REINTENTOS) - 1)
            delay = DELAY_REINTENTOS[indice_delay]
            programar_reintento(connection, ciacodigo, facnumfac, loccodigo, emdestinatario, nuevo_intento, mensaje_error, delay)
            print(f"    ↻ {facnumfac} a {emdestinatario} falló (intento {nuevo_intento}/{MAX_REINTENTOS}). " f"Reintento en {delay} min. Error: {mensaje_error}")
        else:
            marcar_error(connection, ciacodigo, facnumfac, loccodigo, emdestinatario, f"Agotados {MAX_REINTENTOS} intentos. Último error: {mensaje_error}")
            print(f"    ✗ {facnumfac} a {emdestinatario} error definitivo después de {MAX_REINTENTOS} intentos")
        return False


def obtener_archivos(connection, ciacodigo, facnumfac, loccodigo):
    """
    Obtiene el PDF (RIDE) y el XML autorizado del documento electrónico
    desde siacdocelectronicos.

    Parámetros:
        connection: Conexión activa a la BD del cliente
        ciacodigo (str): Código de la empresa
        facnumfac (str): Número del documento electrónico
        loccodigo (str): Código de la localidad

    Retorna:
        tuple: (pdf_content: bytes o None, xml_content: bytes o None)
    """
    resultado = (
        connection.execute(
            text(
                """
                SELECT sripdf, srixmlautorizado
                FROM siacdocelectronicos
                WHERE ciacodigo = :ciacodigo
                  AND facnumfac = :facnumfac
                  AND loccodigo = :loccodigo
            """
            ),
            {"ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo},
        )
        .mappings()
        .first()
    )

    if resultado:
        return resultado.get("sripdf"), resultado.get("srixmlautorizado")
    return None, None


def enviar_correo_smtp(smtp_host, smtp_puerto, smtp_usuario, smtp_password, remitente, destinatario, asunto, mensaje, pdf_content, xml_content, facnumfac):
    """
    Envía un correo electrónico con PDF (RIDE) y XML autorizado adjuntos vía SMTP.

    Soporta:
        - Gmail / Google Workspace (smtp.gmail.com:587)
        - Office 365 / Hotmail (smtp.office365.com:587)
        - Hosting propio / cPanel (mail.dominio.com:587 o 465)
        - Servidores sin autenticación (smtp_password vacío)
        - Conexión SSL (puerto 465) y TLS (puerto 587)

    Parámetros:
        smtp_host (str): Dirección del servidor SMTP
        smtp_puerto (str|int): Puerto del servidor SMTP
        smtp_usuario (str): Usuario para autenticación y remitente (From)
        smtp_password (str): Contraseña para autenticación (vacío si no requiere)
        remitente (str): Email que aparece como remitente (From)
        destinatario (str): Email del destinatario (To)
        asunto (str): Asunto del correo (Subject)
        mensaje (str): Cuerpo del correo en HTML
        pdf_content (bytes): Contenido binario del PDF (RIDE) a adjuntar
        xml_content (bytes): Contenido binario del XML autorizado a adjuntar
        facnumfac (str): Número del documento (para nombre de los archivos adjuntos)

    Retorna:
        tuple: (éxito: bool, mensaje_error: str o None)
    """
    try:
        # Convertir puerto a entero (viene como string desde la BD)
        puerto = int(smtp_puerto) if smtp_puerto else 587

        # Crear el mensaje multipart (cuerpo HTML + adjuntos PDF y XML)
        msg = MIMEMultipart()
        msg["From"] = remitente
        msg["To"] = destinatario
        msg["Subject"] = asunto

        # Adjuntar el cuerpo del mensaje en formato HTML
        msg.attach(MIMEText(mensaje, "html", "utf-8"))

        # Adjuntar el PDF (RIDE)
        if pdf_content:
            pdf_adjunto = MIMEBase("application", "pdf")
            pdf_adjunto.set_payload(pdf_content)
            encoders.encode_base64(pdf_adjunto)
            pdf_adjunto.add_header("Content-Disposition", "attachment", filename=f"{facnumfac}.pdf")
            msg.attach(pdf_adjunto)

        # Adjuntar el XML autorizado
        if xml_content:
            xml_adjunto = MIMEBase("application", "xml")
            xml_adjunto.set_payload(xml_content)
            encoders.encode_base64(xml_adjunto)
            xml_adjunto.add_header("Content-Disposition", "attachment", filename=f"{facnumfac}.xml")
            msg.attach(xml_adjunto)

        # Conectar al servidor SMTP según el puerto
        if puerto == 465:
            # Conexión SSL directa (común en hosting propio)
            server = smtplib.SMTP_SSL(smtp_host, puerto, timeout=30)
        else:
            # Conexión normal + upgrade a TLS (estándar: 587)
            server = smtplib.SMTP(smtp_host, puerto, timeout=30)
            server.ehlo()
            server.starttls()
            server.ehlo()

        # Autenticación (si hay credenciales configuradas)
        if smtp_usuario and smtp_password:
            server.login(smtp_usuario, smtp_password)

        # Enviar el correo
        server.sendmail(remitente, destinatario, msg.as_string())
        server.quit()

        return True, None

    except smtplib.SMTPAuthenticationError:
        return False, f"Error de autenticación: credenciales rechazadas por {smtp_host}"
    except smtplib.SMTPConnectError:
        return False, f"Error de conexión: no se pudo conectar a {smtp_host}:{puerto}"
    except smtplib.SMTPResponseException as e:
        return False, f"Error SMTP {e.smtp_code}: {e.smtp_error.decode() if isinstance(e.smtp_error, bytes) else e.smtp_error}"
    except smtplib.SMTPServerDisconnected:
        return False, "El servidor SMTP cerró la conexión inesperadamente"
    except smtplib.SMTPException as e:
        return False, f"Error SMTP: {str(e)}"
    except TimeoutError:
        return False, f"Timeout: {smtp_host}:{puerto} no respondió en 30 segundos"
    except Exception as e:
        return False, f"Error inesperado: {str(e)}"


def marcar_aprobado(connection, ciacodigo, facnumfac, loccodigo, emdestinatario):
    """
    Marca un registro como enviado exitosamente (estado 'A').

    Parámetros:
        connection: Conexión activa a la BD del cliente (en transacción)
        ciacodigo (str): Código de la empresa
        facnumfac (str): Número del documento
        loccodigo (str): Código de la localidad
        emdestinatario (str): Email del destinatario
    """
    ahora = datetime.now()
    fecha_actual = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    hora_actual = datetime(1900, 1, 1, ahora.hour, ahora.minute, ahora.second)

    connection.execute(
        text(
            """
            UPDATE siacdocelectronicoscorreo
            SET emstatus = 'A',
                emfechaenvio = :fecha_envio,
                emerrordetalle = NULL,
                emproxreintentofec = NULL,
                emproxreintentohor = NULL,
                emfecmsys = :fecha,
                emhormsys = :hora
            WHERE ciacodigo = :ciacodigo
              AND facnumfac = :facnumfac
              AND loccodigo = :loccodigo
              AND emdestinatario = :emdestinatario
        """
        ),
        {"fecha_envio": ahora, "fecha": fecha_actual, "hora": hora_actual, "ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo, "emdestinatario": emdestinatario},
    )


def programar_reintento(connection, ciacodigo, facnumfac, loccodigo, emdestinatario, nuevo_intento, mensaje_error, delay_minutos):
    """
    Programa un reintento para después del delay especificado.
    El registro sigue en estado 'P' pero con emproxreintento establecido.
    El worker lo ignorará hasta que se cumpla esa fecha/hora.

    Parámetros:
        connection: Conexión activa a la BD del cliente (en transacción)
        ciacodigo (str): Código de la empresa
        facnumfac (str): Número del documento
        loccodigo (str): Código de la localidad
        emdestinatario (str): Email del destinatario
        nuevo_intento (int): Número de intento que se acaba de realizar
        mensaje_error (str): Descripción del error ocurrido
        delay_minutos (float): Minutos a esperar antes del próximo reintento
    """
    ahora = datetime.now()
    proximo = ahora + timedelta(minutes=delay_minutos)

    fecha_prox = proximo.replace(hour=0, minute=0, second=0, microsecond=0)
    hora_prox = datetime(1900, 1, 1, proximo.hour, proximo.minute, proximo.second)

    fecha_actual = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    hora_actual = datetime(1900, 1, 1, ahora.hour, ahora.minute, ahora.second)

    error_truncado = mensaje_error if mensaje_error else "Error desconocido"

    connection.execute(
        text(
            """
            UPDATE siacdocelectronicoscorreo
            SET emstatus = 'P',
                emintentos = :intentos,
                emerrordetalle = :error,
                emproxreintentofec = :prox_fecha,
                emproxreintentohor = :prox_hora,
                emfecmsys = :fecha,
                emhormsys = :hora
            WHERE ciacodigo = :ciacodigo
              AND facnumfac = :facnumfac
              AND loccodigo = :loccodigo
              AND emdestinatario = :emdestinatario
        """
        ),
        {"intentos": nuevo_intento, "error": error_truncado, "prox_fecha": fecha_prox, "prox_hora": hora_prox, "fecha": fecha_actual, "hora": hora_actual, "ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo, "emdestinatario": emdestinatario},
    )


def marcar_error(connection, ciacodigo, facnumfac, loccodigo, emdestinatario, mensaje_error):
    """
    Marca un registro como error definitivo (estado 'E').
    Ya no se reintentará automáticamente. Requiere intervención manual.

    Parámetros:
        connection: Conexión activa a la BD del cliente (en transacción)
        ciacodigo (str): Código de la empresa
        facnumfac (str): Número del documento
        loccodigo (str): Código de la localidad
        emdestinatario (str): Email del destinatario
        mensaje_error (str): Descripción del error ocurrido
    """
    ahora = datetime.now()
    fecha_actual = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    hora_actual = datetime(1900, 1, 1, ahora.hour, ahora.minute, ahora.second)

    error_truncado = mensaje_error if mensaje_error else "Error desconocido"

    connection.execute(
        text(
            """
            UPDATE siacdocelectronicoscorreo
            SET emstatus = 'E',
                emerrordetalle = :error,
                emproxreintentofec = NULL,
                emproxreintentohor = NULL,
                emfecmsys = :fecha,
                emhormsys = :hora
            WHERE ciacodigo = :ciacodigo
              AND facnumfac = :facnumfac
              AND loccodigo = :loccodigo
              AND emdestinatario = :emdestinatario
        """
        ),
        {"error": error_truncado, "fecha": fecha_actual, "hora": hora_actual, "ciacodigo": ciacodigo, "facnumfac": facnumfac, "loccodigo": loccodigo, "emdestinatario": emdestinatario},
    )


# =============================================================================
# PUNTO DE ENTRADA
# =============================================================================

if __name__ == "__main__":
    """
    Ejecución directa del worker:
        python worker_email.py

    Para producción, configurar en Servy como otro proceso.
    """
    ejecutar_worker()
