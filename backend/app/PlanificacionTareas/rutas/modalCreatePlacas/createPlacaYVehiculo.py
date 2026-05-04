from flask import jsonify, request
from app.PlanificacionTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint, APIError, ValidationError


@bp.route("/createPlacaYVehiculo", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createPlacaYVehiculo():
    """
    Crea el vehículo en vehmvehiculos y luego la placa en vehmplaca
    """

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()

    # Validación de campos obligatorios
    REQUIRED_FIELDS = [
        "placa",
        "vehmarcodigo",
        "vehmardesci",
        "vehmodcodigo",
        "vehmoddesci",
        "vehanio",
        "vehcilindraje",
        "vehclacodigo",
        # "vehcladesci",
        "vehtipcodigo",
        # "vehtipdesci",
        "vehcombustible",
        "vehcarroceria",
        "paiscodigo",
        "vehtoneladas",
        "vehpasajeros",
    ]

    missing_fields = [field for field in REQUIRED_FIELDS if field not in data or not data[field]]
    if missing_fields:
        raise ValidationError("Faltan parámetros obligatorios", missing_fields)

    # Obtener datos del formulario que deberia volver SRI
    placa = data.get("placa")
    marca_codigo = data.get("vehmarcodigo")
    marca_nombre = data.get("vehmardesci")
    modelo_codigo = data.get("vehmodcodigo")
    modelo_nombre = data.get("vehmoddesci")
    anio = int(data.get("vehanio"))
    cilindraje = float(data.get("vehcilindraje", 0)) if data.get("vehcilindraje") else 0

    # Datos adicionales para vehmvehiculos
    clase_codigo = data.get("vehclacodigo")
    # clase_nombre = data.get("vehcladesci")
    tipo_codigo = data.get("vehtipcodigo")
    # tipo_nombre = data.get("vehtipdesci")
    combustible = data.get("vehcombustible", "")
    carroceria = data.get("vehcarroceria", "")
    paiscodigo = data.get("paiscodigo", "")
    toneladas = float(data.get("vehtoneladas", 0)) if data.get("vehtoneladas") else 0
    pasajeros = int(data.get("vehpasajeros", 0)) if data.get("vehpasajeros") else 0

    # Datos adicionales para vehmplaca
    chasis = "SIN"
    motor = "SIN"
    ramv = "SIN"
    colorcodigo = "SIN"

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as conn:
        with conn.begin():

            # 1. CREAR MARCA SI ES NUEVA (código = "SIN")
            if marca_codigo == "SIN" and marca_nombre:
                marca_codigo = marca_nombre

                insert_marca = text(
                    """
                    INSERT INTO vehbmarca (vehmarcodigo, vehmardesci)
                    VALUES (:codigo, :nombre)
                """
                )
                conn.execute(insert_marca, {"codigo": marca_codigo, "nombre": marca_nombre})

            # 2. CREAR MODELO SI ES NUEVO (código = "SIN")
            if modelo_codigo == "SIN" and modelo_nombre:
                modelo_codigo = modelo_nombre

                insert_modelo = text(
                    """
                    INSERT INTO vehbmodelo (vehmodcodigo, vehmoddesci)
                    VALUES (:codigo, :nombre)
                """
                )
                conn.execute(insert_modelo, {"codigo": modelo_codigo, "nombre": modelo_nombre})

            # 3. VERIFICAR SI EL VEHÍCULO YA EXISTE EN vehmvehiculos
            query_verificar_vehiculo = text(
                """
                SELECT COUNT(*) FROM vehmvehiculos
                WHERE vehmarcodigo = :marca
                AND vehmodcodigo = :modelo
                AND vehclacodigo = :clase
                AND vehtipcodigo = :tipo
                AND vehanio = :anio
            """
            )

            vehiculo_existe = conn.execute(query_verificar_vehiculo, {"marca": marca_codigo, "modelo": modelo_codigo, "clase": clase_codigo, "tipo": tipo_codigo, "anio": anio}).scalar()

            # Solo crear en vehmvehiculos si no existe
            if vehiculo_existe == 0:
                insert_vehiculo = text(
                    """
                    INSERT INTO vehmvehiculos (
                        vehmarcodigo, vehmodcodigo, vehclacodigo, vehtipcodigo, vehanio,
                        vehcilindraje, vehpasajeros, vehtoneladas, paiscodigo,
                        vehcombustible, vehcarroceria
                    ) VALUES (
                        :marca, :modelo, :clase, :tipo, :anio,
                        :cilindraje, :pasajeros, :toneladas, :paiscodigo,
                        :combustible, :carroceria
                    )
                """
                )

                conn.execute(
                    insert_vehiculo, {"marca": marca_codigo, "modelo": modelo_codigo, "clase": clase_codigo, "tipo": tipo_codigo, "anio": anio, "cilindraje": cilindraje, "pasajeros": pasajeros, "toneladas": toneladas, "paiscodigo": paiscodigo, "combustible": combustible, "carroceria": carroceria}
                )

            # 4. VERIFICAR SI LA PLACA YA EXISTE
            query_verificar_placa = text(
                """
                SELECT COUNT(*) FROM vehmplaca
                WHERE vehplaca = :placa
            """
            )

            placa_existe = conn.execute(query_verificar_placa, {"placa": placa}).scalar()

            if placa_existe > 0:
                raise APIError(f"La placa {placa} ya existe en el sistema")

            # 4. CREAR PLACA EN vehmplaca
            insert_placa = text(
                """
                INSERT INTO vehmplaca (
                    vehplaca, vehmarcodigo, vehmodcodigo, vehclacodigo, vehtipcodigo, vehanio,
                    vehchasis, vehmotor, vehramv, colorcodigo
                ) VALUES (
                    :placa, :marca, :modelo, :clase, :tipo, :anio,
                    :chasis, :motor, :ramv, :colorcodigo
                )
            """
            )

            conn.execute(insert_placa, {"placa": placa, "marca": marca_codigo, "modelo": modelo_codigo, "clase": clase_codigo, "tipo": tipo_codigo, "anio": anio, "chasis": chasis, "motor": motor, "ramv": ramv, "colorcodigo": colorcodigo})

            return {"message": f"Vehículo con placa {placa} creado exitosamente", "codigos": {"placa": placa, "marca": marca_codigo, "modelo": modelo_codigo, "clase": clase_codigo, "tipo": tipo_codigo}}
