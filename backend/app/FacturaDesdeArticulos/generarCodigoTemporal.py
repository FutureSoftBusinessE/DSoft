from app.FacturaDesdeArticulos import bp
from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from flask_cors import cross_origin
from app.extensions import db
from app.db import get_session
from sqlalchemy import text
from datetime import datetime


@bp.route("/generarCodigoPedidoTemporal", methods=["GET"])
@cross_origin()
@jwt_required()
def generarCodigoPedidoTemporal():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                # ----- --------ALGORITMO PARA GENERAR SECUENCIA PEDIDO ------------
                # Obtener el servidor actual
                locservidor_query = """
                SELECT locservidor
                FROM siacser
                WHERE serstatus = 'A'
                """
                locservidor_result = connection.execute(text(locservidor_query)).mappings().fetchone()
                locservidor = locservidor_result["locservidor"]

                year = datetime.now().strftime("%y")
                _dptoanio = datetime.now().strftime("%Y")
                _doccodigo = "PED"

                # Obtener el registro actual en cgpdpto filtrado por los parámetros
                cgpdpto_query = """
                SELECT dptonumsec
                FROM cgpdpto
                WHERE ciacodigo = :ciacodigo
                AND loccodigo = :loccodigo
                AND dptoanio = :dptoanio
                AND doccodigo = :doccodigo
                """
                cgpdpto_result = (
                    connection.execute(
                        text(cgpdpto_query),
                        {
                            "ciacodigo": ciacodigo,
                            "loccodigo": loccodigo,
                            "dptoanio": _dptoanio,
                            "doccodigo": _doccodigo,
                        },
                    )
                    .mappings()
                    .fetchone()
                )
                if not cgpdpto_result:
                    raise Exception("No se ha configurado en el sistema la secuencia PED")
                # Obtener y actualizar la secuencia actual
                secuenciaActualPedido = cgpdpto_result["dptonumsec"]
                nuevaSecuenciaActualPedido = secuenciaActualPedido + 1

                # Generar el código del Pedido concatenando los valores
                pedidoCodigoGenerated = f"PE{locservidor}{year}{nuevaSecuenciaActualPedido:06}{loccodigo}"

                return (
                    jsonify(
                        {
                            "success": True,
                            "data": pedidoCodigoGenerated,
                        }
                    ),
                    200,
                )

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                }
            ),
            200,
        )
