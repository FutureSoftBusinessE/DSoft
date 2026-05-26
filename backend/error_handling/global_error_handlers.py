"""
HANDLERS GLOBALES DE ERRORES PARA API FLASK
============================================

DESCRIPCIÓN:
------------
Este módulo convierte TODOS los errores de Flask a respuestas JSON estructuradas.
Incluye handlers para:
• Errores HTTP (404, 405, etc.)
• Errores de JWT (autenticación)
• Errores del sistema API (ValidationError, NotFoundError, etc.)
• Cualquier otra excepción no manejada (NameError, ValueError, etc.)

CONFIGURACIÓN:
--------------
En tu archivo __init__.py (DESPUÉS de setup_error_handling):
setup_global_error_handlers(app)

IMPORTANTE:
• Debe configurarse DESPUÉS de setup_error_handling()
• setup_error_handling() genera el request_id que estos handlers usan

RESULTADO:
----------
Cualquier error (incluso NameError, ValueError, etc.) devolverá:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje del error",
    "type": "TipoDeError"
  },
  "metadata": {
    "timestamp": "2024-01-22T14:30:00.123456",
    "path": "/api/endpoint",
    "method": "GET",
    "request_id": "req_1737559200123"
  }
}
"""

from flask import jsonify, request, g
from datetime import datetime
import traceback
import logging
import uuid


# Importar los errores del sistema existente
from error_handling import APIError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError, DatabaseError, ExternalServiceError, BusinessRuleError


# ==================== FUNCIÓN AUXILIAR PARA REQUEST_ID ====================


def get_request_id():
    """
    Obtiene el request_id actual del contexto Flask.

    FUNCIONAMIENTO:
    1. Busca g.request_id (generado por setup_error_handling)
    2. Si no existe, genera uno de emergencia

    RETORNA:
    • str: Request_id actual o uno de emergencia

    NOTA:
    setup_error_handling() debe ejecutarse antes para que g.request_id exista.
    """
    # Buscar request_id en el contexto Flask
    if hasattr(g, "request_id"):
        return g.request_id
    else:
        # Generar ID de emergencia si no existe (no debería ocurrir)
        return f"emergency_{uuid.uuid4().hex[:8]}"


# ==================== HANDLERS PARA ERRORES HTTP ====================


def setup_global_error_handlers(app):
    """
    Configura handlers globales que convierten TODOS los errores a JSON.

    ORDEN DE EJECUCIÓN:
    -------------------
    1. Flask detecta un error
    2. Busca handlers específicos para ese tipo de error
    3. Si no encuentra, usa el handler genérico (Exception)

    HANDLERS CONFIGURADOS:
    ----------------------
    • 404 - Endpoint no encontrado
    • 405 - Método HTTP no permitido
    • JWTExtendedException - Errores de autenticación JWT
    • APIError - Todos los errores del sistema API
    • ValueError, TypeError, KeyError - Errores comunes de Python
    • Exception - Cualquier otro error no manejado

    EJEMPLOS DE USO:
    ----------------
    # En desarrollo:
    GET /endpoint-inexistente → JSON 404 con request_id

    # En producción:
    POST /endpoint-con-error → JSON 500 con mensaje genérico

    LOGGING:
    --------
    Todos los handlers incluyen request_id en los logs.
    """

    # ==================== HANDLER 404 - ENDPOINT NO ENCONTRADO ====================

    @app.errorhandler(404)
    def handle_404_error(error):
        """
        Maneja errores 404 (endpoint no encontrado).

        EJEMPLO:
        GET /api/endpoint-que-no-existe → 404 JSON

        RESPUESTA:
        {
          "success": false,
          "error": {
            "code": "NOT_FOUND_ERROR",
            "message": "endpoint '/api/endpoint-que-no-existe' not found",
            "type": "NotFoundError"
          },
          "metadata": {...}
        }
        """
        request_id = get_request_id()

        # Loggear el 404 (warning, no error)
        app.logger.warning(f"[{request_id}] 404 Not Found: {request.method} {request.path}", extra={"request_id": request_id, "endpoint": request.endpoint, "user_agent": request.user_agent.string if request.user_agent else None})

        # Crear respuesta JSON estructurada
        response = {"success": False, "error": {"code": "NOT_FOUND_ERROR", "message": f"endpoint '{request.path}' not found", "type": "NotFoundError"}, "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "request_id": request_id}}

        return jsonify(response), 404

    # ==================== HANDLER 405 - MÉTODO NO PERMITIDO ====================

    @app.errorhandler(405)
    def handle_405_error(error):
        """
        Maneja errores 405 (método HTTP no permitido).

        EJEMPLO:
        POST /api/endpoint-solo-GET → 405 JSON

        RESPUESTA:
        {
          "success": false,
          "error": {
            "code": "METHOD_NOT_ALLOWED",
            "message": "Método POST no permitido para /api/endpoint",
            "type": "MethodNotAllowed"
          },
          "metadata": {
            "allowed_methods": ["GET"]
          }
        }
        """
        request_id = get_request_id()

        app.logger.warning(f"[{request_id}] 405 Method Not Allowed: {request.method} {request.path}", extra={"request_id": request_id, "allowed_methods": error.valid_methods if hasattr(error, "valid_methods") else []})

        response = {
            "success": False,
            "error": {"code": "METHOD_NOT_ALLOWED", "message": f"Método {request.method} no permitido para {request.path}", "type": "MethodNotAllowed"},
            "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "request_id": request_id, "allowed_methods": error.valid_methods if hasattr(error, "valid_methods") else []},
        }

        return jsonify(response), 405

    # ==================== HANDLER PARA ERRORES JWT ====================

    try:
        from flask_jwt_extended.exceptions import JWTExtendedException

        @app.errorhandler(JWTExtendedException)
        def handle_jwt_error(error):
            """
            Maneja errores de JWT (token inválido, expirado, etc.).

            REQUIERE: flask-jwt-extended instalado

            EJEMPLOS:
            • Token expirado → 401 JSON
            • Token inválido → 401 JSON
            • Token no proporcionado → 401 JSON

            RESPUESTA:
            {
              "success": false,
              "error": {
                "code": "AUTHENTICATION_ERROR",
                "message": "Token has expired",
                "type": "JWTExtendedException"
              },
              "metadata": {...}
            }
            """
            request_id = get_request_id()

            app.logger.warning(f"[{request_id}] JWT Error: {type(error).__name__}: {str(error)}", extra={"request_id": request_id})

            response = {"success": False, "error": {"code": "AUTHENTICATION_ERROR", "message": str(error), "type": type(error).__name__}, "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "request_id": request_id}}

            return jsonify(response), 401

    except ImportError:
        # Flask-JWT-Extended no está instalado, omitir este handler
        app.logger.debug("Flask-JWT-Extended no encontrado, omitiendo handler JWT")

    # ==================== HANDLER PARA ERRORES DEL SISTEMA API ====================

    @app.errorhandler(APIError)
    def handle_api_error(error):
        """
        Maneja todos los errores del sistema API (ValidationError, NotFoundError, etc.).

        ESTOS ERRORES:
        • Ya tienen estructura definida (código, mensaje, detalles)
        • Solo necesitamos formatearlos como JSON
        • Incluyen request_id para trazabilidad

        RESPUESTA TÍPICA:
        {
          "success": false,
          "error": {
            "code": "VALIDATION_ERROR",
            "message": "Error de validación",
            "type": "ValidationError",
            "details": {...}  # Solo en desarrollo
          },
          "metadata": {...}
        }
        """
        request_id = get_request_id()

        # Determinar nivel de log según código HTTP
        if error.status_code >= 500:
            log_level = logging.ERROR
        elif error.status_code >= 400:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO

        # Loggear el error
        app.logger.log(log_level, f"[{request_id}] API Error [{error.status_code}]: {error.message}", extra={"request_id": request_id, "error_code": error.error_code, "path": request.path, "method": request.method, "status_code": error.status_code})

        # Construir respuesta base
        response = {"success": False, "error": {"code": error.error_code, "message": error.message, "type": error.__class__.__name__}, "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "request_id": request_id}}

        # Añadir detalles del error (solo en desarrollo)
        if app.config.get("DEBUG") and hasattr(error, "details") and error.details:
            response["error"]["details"] = error.details

        # Headers especiales para RateLimitError
        headers = {}
        if isinstance(error, RateLimitError) and hasattr(error, "retry_after") and error.retry_after:
            headers["Retry-After"] = str(error.retry_after)

        return jsonify(response), error.status_code, headers

    # ==================== HANDLER PARA CUALQUIER OTRO ERROR ====================

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """
        Catch-all handler para CUALQUIER error no manejado específicamente.

        MANEJA:
        • NameError (variable no definida)
        • ValueError (valor incorrecto)
        • TypeError (tipo incorrecto)
        • AttributeError (atributo no existe)
        • KeyError (clave no existe en dict)
        • Cualquier otra excepción de Python

        IMPORTANTE:
        • En desarrollo: muestra detalles del error
        • En producción: mensaje genérico "Error interno del servidor"
        • Siempre incluye request_id para trazabilidad

        EJEMPLO (DESARROLLO):
        {
          "success": false,
          "error": {
            "code": "INTERNAL_SERVER_ERROR_DEBUG",
            "message": "NameError: name 'engine' is not defined",
            "type": "NameError",
            "debug": {
              "traceback": "Traceback (most recent call last):..."
            }
          },
          "metadata": {...}
        }

        EJEMPLO (PRODUCCIÓN):
        {
          "success": false,
          "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "Error interno del servidor",
            "type": "NameError"
          },
          "metadata": {...}
        }
        """
        request_id = get_request_id()

        # Loggear el error con información completa
        app.logger.error(f"[{request_id}] Unhandled Exception: {type(error).__name__}: {str(error)}", exc_info=True, extra={"request_id": request_id, "path": request.path, "method": request.method, "endpoint": request.endpoint})  # Incluye traceback completo

        # Determinar si estamos en modo desarrollo
        is_debug = app.config.get("DEBUG", False)

        # Construir respuesta según el entorno
        if is_debug:
            # Desarrollo: mostrar detalles
            error_message = f"{type(error).__name__}: {str(error)}"
            error_code = "INTERNAL_SERVER_ERROR_DEBUG"
        else:
            # Producción: mensaje genérico
            error_message = "Error interno del servidor"
            error_code = "INTERNAL_SERVER_ERROR"

        response = {"success": False, "error": {"code": error_code, "message": error_message, "type": type(error).__name__}, "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "endpoint": request.endpoint, "request_id": request_id}}

        # Solo en desarrollo añadir traceback
        if is_debug:
            response["error"]["debug"] = {"traceback": traceback.format_exc()}

        return jsonify(response), 500

    # ==================== HANDLERS PARA ERRORES COMUNES DE PYTHON ====================

    # @app.errorhandler(ValueError)
    # def handle_value_error(error):
    #     """
    #     Maneja errores ValueError (valor incorrecto).

    #     EJEMPLO:
    #     int("no-es-un-numero") → ValueError

    #     RESPUESTA:
    #     {
    #       "success": false,
    #       "error": {
    #         "code": "VALIDATION_ERROR",
    #         "message": "Error de validación: invalid literal for int()...",
    #         "type": "ValueError"
    #       },
    #       "metadata": {...}
    #     }
    #     """
    #     request_id = get_request_id()
    #     traceback_msg = traceback.format_exc()

    #     app.logger.warning(f"[{request_id}] ValueError: {str(error)}", extra={"request_id": request_id, "traceback": traceback_msg})

    #     response = {"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Error de validación: {str(error)}", "type": "ValueError"}, "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "request_id": request_id}}

    #     return jsonify(response), 400

    # @app.errorhandler(TypeError)
    # def handle_type_error(error):
    #     """
    #     Maneja errores TypeError (tipo incorrecto).

    #     EJEMPLO:
    #     "texto" + 123 → TypeError

    #     RESPUESTA:
    #     {
    #       "success": false,
    #       "error": {
    #         "code": "VALIDATION_ERROR",
    #         "message": "Error de tipo de dato: can only concatenate str...",
    #         "type": "TypeError"
    #       },
    #       "metadata": {...}
    #     }
    #     """
    #     request_id = get_request_id()

    #     app.logger.warning(f"[{request_id}] TypeError: {str(error)}", extra={"request_id": request_id})

    #     response = {"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Error de tipo de dato: {str(error)}", "type": "TypeError"}, "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "request_id": request_id}}

    #     return jsonify(response), 400

    # @app.errorhandler(KeyError)
    # def handle_key_error(error):
    #     """
    #     Maneja errores KeyError (clave no encontrada en diccionario).

    #     EJEMPLO:
    #     datos = {"nombre": "Juan"}
    #     datos["edad"] → KeyError: 'edad'

    #     RESPUESTA:
    #     {
    #       "success": false,
    #       "error": {
    #         "code": "VALIDATION_ERROR",
    #         "message": "Campo requerido no encontrado: 'edad'",
    #         "type": "KeyError"
    #       },
    #       "metadata": {...}
    #     }
    #     """
    #     request_id = get_request_id()

    #     app.logger.warning(f"[{request_id}] KeyError: {str(error)}", extra={"request_id": request_id})

    #     response = {"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Campo requerido no encontrado: {str(error)}", "type": "KeyError"}, "metadata": {"timestamp": datetime.now().isoformat(), "path": request.path, "method": request.method, "request_id": request_id}}

    #     return jsonify(response), 400

    # ==================== CONFIRMACIÓN DE CONFIGURACIÓN ====================

    app.logger.info("[OK] Global error handlers configured successfully")

    return app
