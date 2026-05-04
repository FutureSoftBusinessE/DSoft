from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint, APIError, ValidationError
import requests
import json


@bp.route("/getInfoVehicleSRI/<placa>", methods=["GET"])
@cross_origin()
@jwt_required()
@api_endpoint
def get_info_vehicle_sri(placa):
    """
    Consulta el SRI para obtener información de un vehículo por placa
    """
    try:
        # Validar que la placa no esté vacía
        if not placa or not placa.strip():
            raise ValidationError("La placa es requerida")

        # URL de la API del SRI
        sri_url = f"https://srienlinea.sri.gob.ec/sri-matriculacion-vehicular-recaudacion-servicio-internet/rest/BaseVehiculo/obtenerPorNumeroPlacaOPorNumeroCampvOPorNumeroCpn?numeroPlacaCampvCpn={placa}"

        # Headers para simular un navegador
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "es-ES,es;q=0.9",
            "Connection": "keep-alive",
        }

        # Hacer la solicitud al SRI
        response = requests.get(sri_url, headers=headers, timeout=15)

        if response.status_code == 200:
            try:
                sri_data = response.json()

                # el SRI deberia devolver esto numeroPlaca,

                # Verificar si se encontró el vehículo
                if sri_data and "numeroPlaca" in sri_data:
                    # Formatear la respuesta para el frontend
                    formatted_data = {
                        "numeroPlaca": sri_data.get("numeroPlaca", ""),
                        "descripcionMarca": sri_data.get("descripcionMarca", ""),
                        "descripcionModelo": sri_data.get("descripcionModelo", ""),
                        "anioAuto": sri_data.get("anioAuto"),
                        "descripcionPais": sri_data.get("descripcionPais", ""),
                        "cilindraje": sri_data.get("cilindraje"),
                        "nombreClase": sri_data.get("nombreClase", ""),
                        "descripcionServicio": sri_data.get("descripcionServicio", ""),
                        "colorVehiculo1": sri_data.get("colorVehiculo1", ""),
                        "colorVehiculo2": sri_data.get("colorVehiculo2", ""),
                        "fechaUltimaMatricula": sri_data.get("fechaUltimaMatricula"),
                        "ultimoAnioPagado": sri_data.get("ultimoAnioPagado"),
                        "estadoExoneracion": sri_data.get("estadoExoneracion", ""),
                    }

                    # Buscar si la marca y modelo ya existen en nuestra BD
                    claims = get_jwt()
                    clicianonBD = claims["seleccion"]["clicianonBD"]
                    db.session = get_session(clicianonBD)
                    engine = db.session.bind

                    with engine.connect() as conn:
                        # Validar que la placa no exista en nuestra bd

                        query_placa = text(
                            """
                            SELECT vehplaca
                            FROM vehmplaca
                            WHERE vehplaca = :vehmplaca
                        """
                        )

                        # Ejecutar la query pasando el parámetro correcto
                        placa_existe_result = conn.execute(query_placa, {"vehmplaca": placa}).fetchone()

                        if placa_existe_result:
                            raise APIError(f"La placa {placa} ya está registrada en el sistema")

                        # Buscar marca
                        marca_codigo = "SIN"
                        if sri_data.get("descripcionMarca"):
                            query_marca = text(
                                """
                                SELECT vehmarcodigo as value, vehmardesci as label
                                FROM vehbmarca
                                WHERE vehmarcodigo = :marca_nombre
                            """
                            )
                            marca_result = conn.execute(query_marca, {"marca_nombre": sri_data.get("descripcionMarca")}).fetchone()

                            if marca_result:
                                marca_codigo = marca_result[0]
                                formatted_data["marca_codigo"] = marca_codigo
                                formatted_data["marca_label"] = marca_result[1]

                        # Buscar modelo
                        modelo_codigo = "SIN"
                        if sri_data.get("descripcionModelo"):
                            query_modelo = text(
                                """
                                SELECT vehmodcodigo as value, vehmoddesci as label
                                FROM vehbmodelo
                                WHERE vehmodcodigo = :modelo_nombre
                            """
                            )
                            modelo_result = conn.execute(query_modelo, {"modelo_nombre": sri_data.get("descripcionModelo")}).fetchone()

                            if modelo_result:
                                modelo_codigo = modelo_result[0]
                                formatted_data["modelo_codigo"] = modelo_codigo
                                formatted_data["modelo_label"] = modelo_result[1]

                        # Agregar códigos al response
                        formatted_data["marca_codigo"] = marca_codigo
                        formatted_data["modelo_codigo"] = modelo_codigo

                    return formatted_data
                else:
                    raise APIError(f"No se pudo encontrar la placa {placa} en el sistema del SRI")

            except json.JSONDecodeError:
                raise APIError("Error al procesar la respuesta del SRI")
            except Exception as e:
                raise APIError(f"Error procesando datos del SRI: {str(e)}")
        else:
            raise APIError(f"Error al consultar el SRI. Código: {response.status_code}")

    except requests.exceptions.Timeout:
        raise APIError("Timeout al consultar el SRI. Intente nuevamente.")
    except requests.exceptions.ConnectionError:
        raise APIError("Error de conexión con el SRI. Verifique su conexión a internet.")
    except requests.exceptions.RequestException as e:
        raise APIError(f"Error en la solicitud al SRI: {str(e)}")
    except ValidationError as ve:
        raise ve
    except Exception as e:
        raise APIError(f"Error interno del servidor: {str(e)}")
