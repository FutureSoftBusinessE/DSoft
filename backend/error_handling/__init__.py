"""
SISTEMA DE MANEJO DE ERRORES PARA API FLASK
===========================================

DESCRIPCIÓN:
------------
Este módulo proporciona un sistema completo para manejo de errores en APIs Flask.
Incluye:
1. Clases de errores específicos para diferentes casos
2. Middleware para logging y generación de request_id
3. Decorador @api_endpoint para nuevos endpoints
4. Utilidades para validación de datos

CONFIGURACIÓN:
--------------
En tu archivo __init__.py:
1. setup_error_handling(app)   # Primero: genera request_id
2. setup_global_error_handlers(app)  # Después: maneja errores globales

USO:
----
# Para nuevos endpoints (recomendado):
@bp.route("/mi-endpoint")
@api_endpoint
def mi_endpoint():
    validate_required(request.json, {"campo": str})
    # ... lógica
    return datos

# Para lanzar errores específicos:
raise ValidationError("Mensaje de error", details={"campo": "valor"})
raise NotFoundError("usuario", "123")

CARACTERÍSTICAS:
----------------
• Genera request_id único por cada petición
• Logs automáticos con request_id para trazabilidad
• Respuestas JSON estructuradas para errores
• Compatible con endpoints nuevos y existentes
"""

import time
from functools import wraps
from flask import jsonify, request, g, current_app
import logging
from datetime import datetime


# ==================== CLASES DE ERRORES ESPECÍFICOS ====================


class APIError(Exception):
    """
    Clase base para todos los errores de la API.

    ATRIBUTOS:
    • message: Mensaje descriptivo del error
    • status_code: Código HTTP (default 500)
    • error_code: Código interno único del error
    """

    def __init__(self, message, status_code=500, error_code=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "INTERNAL_ERROR"


class ValidationError(APIError):
    """
    Error de validación de datos (HTTP 400).

    EJEMPLO:
    raise ValidationError("Email inválido", details={"email": "formato incorrecto"})
    """

    def __init__(self, message="Validation error", details=None):
        super().__init__(message, 400, "VALIDATION_ERROR")
        self.details = details or {}


class AuthenticationError(APIError):
    """
    Error de autenticación (HTTP 401).

    EJEMPLO:
    raise AuthenticationError("Token JWT expirado")
    """

    def __init__(self, message="Authentication required"):
        super().__init__(message, 401, "AUTHENTICATION_ERROR")


class AuthorizationError(APIError):
    """
    Error de autorización/permisos (HTTP 403).

    EJEMPLO:
    raise AuthorizationError("No tienes permiso para ver este recurso",
                           resource="usuario", action="read")
    """

    def __init__(self, message="Insufficient permissions", resource=None, action=None):
        details = {}
        if resource:
            details["resource"] = resource
        if action:
            details["action"] = action

        super().__init__(message, 403, "AUTHORIZATION_ERROR")
        self.details = details


class NotFoundError(APIError):
    """
    Recurso no encontrado (HTTP 404).

    EJEMPLO:
    raise NotFoundError("usuario", "123")
    """

    def __init__(self, resource, resource_id):
        super().__init__(f"{resource} '{resource_id}' not found", 404, "NOT_FOUND_ERROR")
        self.details = {"resource": resource, "id": resource_id}


class ConflictError(APIError):
    """
    Conflicto - Recurso ya existe (HTTP 409).

    EJEMPLO:
    raise ConflictError("usuario", "juan@email.com")
    """

    def __init__(self, resource, resource_id):
        super().__init__(f"{resource} '{resource_id}' already exists", 409, "CONFLICT_ERROR")
        self.details = {"resource": resource, "id": resource_id}


class RateLimitError(APIError):
    """
    Límite de tasa excedido (HTTP 429).

    EJEMPLO:
    raise RateLimitError(limit=100, period="hora", retry_after=60)
    """

    def __init__(self, limit, period, retry_after=None):
        message = f"Rate limit exceeded: {limit} requests per {period}"
        super().__init__(message, 429, "RATE_LIMIT_ERROR")
        self.details = {"limit": limit, "period": period}
        self.retry_after = retry_after


class DatabaseError(APIError):
    """
    Error de base de datos (HTTP 500).

    EJEMPLO:
    raise DatabaseError("consulta usuarios", details={"query": "SELECT * FROM users"})
    """

    def __init__(self, operation, details=None):
        super().__init__(f"Database error during {operation}", 500, "DATABASE_ERROR")
        self.details = {"operation": operation, **(details or {})}


class ExternalServiceError(APIError):
    """
    Error de servicio externo (HTTP 502).

    EJEMPLO:
    raise ExternalServiceError("servicio_pagos", details={"status": 503})
    """

    def __init__(self, service_name, details=None):
        super().__init__(f"External service '{service_name}' unavailable", 502, "EXTERNAL_SERVICE_ERROR")
        self.details = {"service": service_name, **(details or {})}


class BusinessRuleError(APIError):
    """
    Violación de regla de negocio (HTTP 400).

    EJEMPLO:
    raise BusinessRuleError("saldo_insuficiente", details={"saldo": 100, "requerido": 200})
    """

    def __init__(self, rule_name, details=None):
        super().__init__(f"Business rule violation: {rule_name}", 400, "BUSINESS_RULE_ERROR")
        self.details = {"rule": rule_name, **(details or {})}


# ==================== UTILIDADES DE VALIDACIÓN ====================


def validate_required(data, required_fields):
    """
    Valida campos requeridos en un diccionario.

    PARÁMETROS:
    • data: Diccionario con datos a validar
    • required_fields: Diccionario con {campo: tipo_esperado} o {campo: (tipo1, tipo2)}

    RETORNA:
    • True si todos los campos son válidos

    LANZA:
    • ValidationError si hay campos faltantes o tipos incorrectos

    EJEMPLOS:
    validate_required(request.json, {"email": str, "age": int})
    validate_required(request.json, {"amount": (int, float)})

    RESULTADO ERROR:
    ValidationError con details={
        "field_errors": [
            {"field": "email", "error": "Campo requerido", ...},
            {"field": "age", "error": "Tipo incorrecto. Esperado: int", ...}
        ]
    }
    """
    if not isinstance(data, dict):
        raise ValidationError("Se esperaba un objeto JSON", details={"received_type": type(data).__name__})

    field_errors = []

    for field, expected_type in required_fields.items():
        value = data.get(field)

        # Verificar si existe
        if value is None:
            field_errors.append({"field": field, "error": "Campo requerido", "value": None})
            continue

        # Verificar tipo (si se especifica)
        if expected_type:
            # Permitir múltiples tipos
            if isinstance(expected_type, tuple):
                if not any(isinstance(value, t) for t in expected_type):
                    field_errors.append({"field": field, "error": f"Tipo incorrecto. Esperado: {[t.__name__ for t in expected_type]}", "value": value, "actual_type": type(value).__name__})
            elif not isinstance(value, expected_type):
                field_errors.append({"field": field, "error": f"Tipo incorrecto. Esperado: {expected_type.__name__}", "value": value, "actual_type": type(value).__name__})

    if field_errors:
        raise ValidationError("Error de validación en los datos recibidos", details={"field_errors": field_errors})

    return True


# ==================== DECORADOR PARA ENDPOINTS NUEVOS ====================


def api_endpoint(func):
    """
    Decorador para NUEVOS endpoints que quieran usar el sistema de errores.

    CARACTERÍSTICAS:
    • Captura excepciones y las convierte a respuestas JSON estructuradas
    • Incluye automáticamente metadata (timestamp, request_id, duración, etc.)
    • Para endpoints existentes, mantener su comportamiento original

    USO:
    @bp.route("/api/usuarios")
    @api_endpoint
    def get_usuarios():
        validate_required(request.json, {"filtro": str})
        # ... lógica
        return {"usuarios": lista_usuarios}

    RESPUESTAS:
    • Éxito: {"success": true, "data": ..., "metadata": {...}}
    • Error API: {"success": false, "error": {...}, "metadata": {...}}
    • Otros errores: Se relanzan para handlers globales
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()

        try:
            # Ejecutar el endpoint
            result = func(*args, **kwargs)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Obtener el request_id actual
            request_id = getattr(g, "request_id", "unknown")

            # Formatear respuesta exitosa
            response_data = {"success": True, "data": result, "metadata": {"timestamp": datetime.now().isoformat(), "endpoint": request.endpoint, "method": request.method, "duration_ms": duration_ms, "request_id": request_id, "path": request.path}}

            return jsonify(response_data), 200

        except APIError as e:
            # Error conocido del sistema API
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Obtener el request_id actual
            request_id = getattr(g, "request_id", "unknown")

            # Formatear respuesta de error
            error_response = {
                "success": False,
                "error": {"code": e.error_code, "message": e.message},
                "metadata": {"timestamp": datetime.now().isoformat(), "endpoint": request.endpoint, "method": request.method, "duration_ms": duration_ms, "path": request.path, "request_id": request_id},
            }

            # Solo en desarrollo añadir detalles del error
            if current_app.config.get("DEBUG") and hasattr(e, "details"):
                error_response["error"]["details"] = e.details

            # Headers especiales para ciertos errores (ej: RateLimitError)
            headers = {}
            if isinstance(e, RateLimitError) and e.retry_after:
                headers["Retry-After"] = str(e.retry_after)

            return jsonify(error_response), e.status_code, headers

        except Exception as e:
            # Para otros errores (NameError, ValueError, etc.), los RE-LANZAMOS
            # Así los endpoints existentes los manejan con los handlers globales
            raise e

    return wrapper


# ==================== MIDDLEWARE PARA LOGGING Y REQUEST_ID ====================


def setup_error_handling(app):
    """
    Configura middleware para logging y generación de request_id.

    QUÉ HACE:
    1. Genera un request_id único para cada petición HTTP
    2. Registra logs de inicio y fin de cada request
    3. Añade headers X-Request-ID a las respuestas
    4. Mejora los logs de excepciones con request_id

    USO:
    app = Flask(__name__)
    setup_error_handling(app)

    ORDEN IMPORTANTE:
    Esta función debe llamarse ANTES de setup_global_error_handlers()

    VARIABLES CREADAS EN g:
    • g.request_id: ID único de la petición (ej: "req_1737559200123")
    • g._request_start_time: Timestamp de inicio (para medir duración)

    LOGS GENERADOS:
    • Inicio: "📥 Request started: GET /api/usuarios"
    • Fin: "✅ Request completed: /api/usuarios - 200 - 0.123s"
    • Errores: "🔥 Unhandled exception: NameError: ..."

    HEADERS AÑADIDOS:
    • X-Request-ID: request_id (en todas las respuestas)
    """

    # Guardar handlers originales de Flask
    original_handle_exception = app.handle_exception
    original_handle_user_exception = app.handle_user_exception

    @app.before_request
    def before_request_logging():
        """
        Middleware que se ejecuta ANTES de cada request.

        ACCIONES:
        1. Genera request_id único basado en timestamp
        2. Guarda tiempo de inicio para medir duración
        3. Registra log de inicio de request
        """
        # Guardar tiempo de inicio
        g._request_start_time = time.time()

        # Generar request_id único
        # Formato: "req_" + timestamp en milisegundos
        g.request_id = f"req_{int(time.time() * 1000)}"

        # Registrar inicio del request
        app.logger.info(f"📥 Request started: {request.method} {request.path}", extra={"request_id": g.request_id, "endpoint": request.endpoint, "ip": request.remote_addr, "user_agent": request.user_agent.string if request.user_agent else None})

    @app.after_request
    def after_request_logging(response):
        """
        Middleware que se ejecuta DESPUÉS de cada request.

        ACCIONES:
        1. Calcula duración de la request
        2. Registra log de fin de request
        3. Añade header X-Request-ID a la respuesta
        """
        if hasattr(g, "_request_start_time"):
            # Calcular duración
            duration = time.time() - g._request_start_time

            # Obtener request_id (ya debería existir)
            request_id = getattr(g, "request_id", "unknown")

            # Registrar fin del request
            app.logger.info(f"✅ Request completed: {request.path} - {response.status_code} - {duration:.3f}s", extra={"request_id": request_id, "status_code": response.status_code, "duration_ms": round(duration * 1000, 2), "method": request.method})

            # Añadir request_id como header HTTP
            if request_id and request_id != "unknown":
                response.headers["X-Request-ID"] = request_id

        return response

    def enhanced_handle_exception(e):
        """
        Handler mejorado para excepciones no manejadas.

        MEJORAS:
        • Incluye request_id en los logs de error
        • Mantiene el handler original de Flask
        """
        # Obtener request_id para logging
        request_id = getattr(g, "request_id", "unknown")

        # Registrar error con información completa
        app.logger.error(f"🔥 Unhandled exception: {type(e).__name__}: {str(e)}", extra={"request_id": request_id, "endpoint": request.endpoint, "exception_type": type(e).__name__, "path": request.path, "method": request.method}, exc_info=True)  # Incluye traceback completo

        # Usar el handler ORIGINAL de Flask
        return original_handle_exception(e)

    def enhanced_handle_user_exception(e):
        """
        Handler mejorado para excepciones de usuario (HTTP 4xx).

        MEJORAS:
        • Incluye request_id en los logs
        • Mantiene el handler original de Flask
        """
        # Obtener request_id para logging
        request_id = getattr(g, "request_id", "unknown")

        # Registrar warning (no es error del sistema)
        app.logger.warning(f"⚠️  User exception: {type(e).__name__}: {str(e)}", extra={"request_id": request_id, "endpoint": request.endpoint, "path": request.path})

        return original_handle_user_exception(e)

    # Reemplazar handlers con versiones mejoradas
    app.handle_exception = enhanced_handle_exception
    app.handle_user_exception = enhanced_handle_user_exception

    # Confirmar configuración
    app.logger.info("✅ Error handling middleware configured")

    return app


# ==================== FUNCIONES AUXILIARES ====================


def get_current_request_id():
    """
    Obtiene el request_id actual desde el contexto Flask.

    USO:
    # Desde cualquier parte de tu código (dentro de un request)
    request_id = get_current_request_id()
    print(f"Request ID actual: {request_id}")

    RETORNA:
    • str: Request_id actual o 'unknown' si no existe

    NOTA:
    Solo funciona dentro del contexto de un request HTTP.
    """
    return getattr(g, "request_id", "unknown")


def log_with_request_id(message, level="info", **extra):
    """
    Registra un log automáticamente con el request_id actual.

    PARÁMETROS:
    • message: Mensaje a loggear
    • level: Nivel de log ('info', 'warning', 'error', 'debug')
    • **extra: Datos adicionales para el log

    EJEMPLOS:
    log_with_request_id("Usuario autenticado", level='info', user_id=123)
    log_with_request_id("Error en base de datos", level='error', query=sql)
    """

    # Obtener request_id actual
    request_id = get_current_request_id()

    # Añadir request_id a los datos extra
    extra_with_id = {"request_id": request_id, **extra}

    # Seleccionar nivel de log
    logger = current_app.logger
    if level == "info":
        logger.info(message, extra=extra_with_id)
    elif level == "warning":
        logger.warning(message, extra=extra_with_id)
    elif level == "error":
        logger.error(message, extra=extra_with_id)
    elif level == "debug":
        logger.debug(message, extra=extra_with_id)
    else:
        logger.info(message, extra=extra_with_id)


# ==================== EXPORTAR ====================

__all__ = [
    # Clases de errores
    "APIError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "NotFoundError",
    "ConflictError",
    "RateLimitError",
    "DatabaseError",
    "ExternalServiceError",
    "BusinessRuleError",
    # Utilidades
    "validate_required",
    # Decorador
    "api_endpoint",
    # Middleware
    "setup_error_handling",
    # Funciones auxiliares
    "get_current_request_id",
    "log_with_request_id",
]
