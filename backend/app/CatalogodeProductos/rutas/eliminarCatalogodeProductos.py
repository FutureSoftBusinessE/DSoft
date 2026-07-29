from flask import request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.CatalogodeProductos import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/eliminarCatalogodeProductos", methods=["POST"])
@jwt_required()
@api_endpoint
def eliminarCatalogodeProductos():
    # 1. Extracción de variables de sesión
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    # 2. Obtener los parámetros de la solicitud
    data = request.get_json()
    invcodigo = data.get("invcodigo")
    artcodigo = data.get("artcodigo")

    # 3. Validación de campos requeridos (Llave compuesta)
    if not invcodigo or str(invcodigo).strip() == "":
        raise ValidationError("El código del inventario es requerido para eliminar el producto.")
    if not artcodigo or str(artcodigo).strip() == "":
        raise ValidationError("El código del artículo es requerido.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Parámetros base para las consultas
            params = {
                "ciacodigo": sCodCia,
                "invcodigo": str(invcodigo).strip().upper(),
                "artcodigo": str(artcodigo).strip().upper(),
            }

            # 4. Validar el estado del artículo (No se pueden eliminar inactivos)
            sql_status = text(
                """
                SELECT artstatus
                FROM inmart WITH (NOLOCK)
                WHERE ciacodigo = :ciacodigo
                  AND invcodigo = :invcodigo
                  AND artcodigo = :artcodigo
                """
            )
            result_status = connection.execute(sql_status, params).fetchone()

            if not result_status:
                raise ValidationError("El artículo no existe o ya fue eliminado.")

            if result_status[0] == "I":
                raise ValidationError("No puede eliminar un registro con estado INACTIVO, verifique.")

            # 5. Validar que no existan transacciones (Compras, Pedidos, Facturas)
            sql_movimientos = text(
                """
                WITH cuantos_CTE (cuantos) AS (
                    SELECT COUNT(*) AS cuantos FROM cxptoc WITH (NOLOCK)
                    WHERE ciacodigo = :ciacodigo
                      AND invcodigo = :invcodigo
                      AND artcodigo = :artcodigo
                    UNION ALL
                    SELECT COUNT(*) AS cuantos FROM fatped WITH (NOLOCK)
                    WHERE ciacodigo = :ciacodigo
                      AND invcodigo = :invcodigo
                      AND artcodigo = :artcodigo
                    UNION ALL
                    SELECT COUNT(*) AS cuantos FROM fatfac WITH (NOLOCK)
                    WHERE ciacodigo = :ciacodigo
                      AND invcodigo = :invcodigo
                      AND artcodigo = :artcodigo
                )
                SELECT SUM(cuantos) AS total_movs FROM cuantos_CTE
                """
            )
            result_movs = connection.execute(sql_movimientos, params).fetchone()

            if result_movs and result_movs[0] > 0:
                raise ValidationError("ERROR: El artículo ha sido ingresado en Órdenes de Compra y/o Pedidos en Ventas, no puede eliminarlo.")

            # 6. Borrado Transaccional (Hijos primero, luego el Padre)
            try:
                # 6.1 Eliminar el stock por bodega asociado al artículo
                sql_del_stock = text(
                    """
                    DELETE FROM inmstock
                    WHERE ciacodigo = :ciacodigo
                      AND invcodigo = :invcodigo
                      AND artcodigo = :artcodigo
                    """
                )
                connection.execute(sql_del_stock, params)

                # 6.2 Eliminar la cabecera principal del artículo
                sql_del_art = text(
                    """
                    DELETE FROM inmart
                    WHERE ciacodigo = :ciacodigo
                      AND invcodigo = :invcodigo
                      AND artcodigo = :artcodigo
                    """
                )
                connection.execute(sql_del_art, params)

            except IntegrityError:
                # Captura de errores por otras Llaves Foráneas (Ej. Códigos de barras, sustitutos, auditorías)
                raise ValidationError("No se puede eliminar el Artículo porque tiene datos relacionados en otras tablas " "(Auditorías, Códigos de Proveedor, Códigos de Barra, etc.).")

    # 7. Respuesta de éxito
    return {"data": "Artículo eliminado exitosamente."}
