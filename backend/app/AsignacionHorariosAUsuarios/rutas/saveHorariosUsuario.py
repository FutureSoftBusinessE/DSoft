from flask import jsonify, request
from app.AsignacionHorariosAUsuarios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from datetime import datetime
from services.encrip_desencrip import encriptar
from app import create_app


@bp.route("/saveHorariosUsuario", methods=["POST"])
@jwt_required()
def saveHorariosUsuario():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usrcodigo = claims["user"]
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Obtener la fecha actual con la hora seteada en 00:00:00 para auditoría
    fecha_con_hora_cero = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    sFecISys = fecha_con_hora_cero  # Fecha de creación

    # Obtener la fecha con formato de 1900-01-01 y la hora actual para auditoría
    fecha_formato_1900 = datetime(1900, 1, 1, datetime.now().hour, datetime.now().minute, datetime.now().second)
    sHorISys = fecha_formato_1900  # Hora de creación

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Datos enviados en el cuerpo de la solicitud

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Información básica que no cambia por cada horario
    usrcodigo_hr = data["usrcodigo"]
    usrnombre = data["usrcodigoNombre"]
    sAccion = data["sAccion"]

    try:
        with engine.connect() as connection:
            with connection.begin():
                if sAccion == "CREATE":
                    # Recorrer cada uno de los horarios y realizar el INSERT
                    for horario in data["horarios"]:
                        loccodigo = horario["loccodigo"]
                        locdescri = horario["locdescri"]
                        hrsecuen = horario["hrsecuen"]
                        hrdia = horario["dia"]
                        hrhorini = f"{fecha_formato_1900.strftime('%Y-%m-%d')} {horario['desde']}"  # Combinar la fecha con la hora de inicio
                        hrhorfin = f"{fecha_formato_1900.strftime('%Y-%m-%d')} {horario['hasta']}"  # Combinar la fecha con la hora de fin
                        hrcupo = horario["cupo"]

                        # Convertir las cadenas de hora 'desde' y 'hasta' a datetime
                        hrhorini = datetime.strptime(hrhorini, "%Y-%m-%d %H:%M")  # Parsear como datetime
                        hrhorfin = datetime.strptime(hrhorfin, "%Y-%m-%d %H:%M")  # Parsear como datetime

                        # Realizamos el INSERT para cada horario
                        insert_query = text(
                            """
                            INSERT INTO rhbhorarios (
                                ciacodigo, loccodigo, usrcodigo, usrcodencrip, hrsecuen, usrnombre, locdescri,
                                hrdia, hrhorini, hrhorfin, hrcupo,
                                hrfecisys, hrfecmsys, hrhorisys, hrhormsys,
                                hrusuisys, hrusumsys, hrestisys, hrestmsys
                            ) VALUES (
                                :ciacodigo, :loccodigo, :usrcodigo, :usrcodencrip, :hrsecuen, :usrnombre, :locdescri,
                                :hrdia, :hrhorini, :hrhorfin, :hrcupo,
                                :hrfecisys, :hrfecmsys, :hrhorisys, :hrhormsys,
                                :hrusuisys, :hrusumsys, :hrestisys, :hrestmsys
                            )
                        """
                        )

                        connection.execute(
                            insert_query,
                            {
                                "ciacodigo": ciacodigo,
                                "loccodigo": loccodigo,
                                "usrcodigo": usrcodigo_hr,
                                "usrcodencrip": encriptar(usrcodigo_hr),
                                "hrsecuen": hrsecuen,
                                "usrnombre": usrnombre,
                                "locdescri": locdescri,
                                "hrdia": hrdia,
                                "hrhorini": hrhorini,  # datetime
                                "hrhorfin": hrhorfin,  # datetime
                                "hrcupo": hrcupo,
                                "hrfecisys": sFecISys,  # Fecha de creación
                                "hrfecmsys": sFecISys,  # Fecha de la última modificación
                                "hrhorisys": sHorISys,  # Hora de creación
                                "hrhormsys": sHorISys,  # Hora de la última modificación
                                "hrusuisys": usrcodigo,  # Usuario que realizó la creación
                                "hrusumsys": usrcodigo,  # Usuario que realizó la última modificación
                                "hrestisys": ipUser,  # Estación de creación
                                "hrestmsys": ipUser,  # Estación de última modificación
                            },
                        )
                        msgFinal = "Guardado exitosamente"
                if sAccion == "EDIT":
                    loccodigo_hr = data["loccodigo"]

                    # 1. ELIMINAR todos los horarios existentes para este usuario en esta localidad
                    delete_query = text(
                        """
                        DELETE FROM rhbhorarios
                        WHERE ciacodigo = :ciacodigo
                        AND usrcodigo = :usrcodigo
                        AND loccodigo = :loccodigo
                        """
                    )

                    connection.execute(delete_query, {"ciacodigo": ciacodigo, "usrcodigo": usrcodigo_hr, "loccodigo": loccodigo_hr})

                    # 2. INSERTAR los nuevos horarios
                    for horario in data["horarios"]:
                        locdescri = horario["locdescri"]
                        hrsecuen = horario["hrsecuen"]
                        hrdia = horario["dia"]
                        hrhorini = f"{fecha_formato_1900.strftime('%Y-%m-%d')} {horario['desde']}"  # Combinar la fecha con la hora de inicio
                        hrhorfin = f"{fecha_formato_1900.strftime('%Y-%m-%d')} {horario['hasta']}"  # Combinar la fecha con la hora de fin
                        hrcupo = horario["cupo"]

                        # Convertir las cadenas de hora 'desde' y 'hasta' a datetime
                        hrhorini = datetime.strptime(hrhorini, "%Y-%m-%d %H:%M")  # Parsear como datetime
                        hrhorfin = datetime.strptime(hrhorfin, "%Y-%m-%d %H:%M")  # Parsear como datetime

                        insert_query = text(
                            """
                            INSERT INTO rhbhorarios (
                                ciacodigo, loccodigo, usrcodigo, usrcodencrip, hrsecuen, usrnombre, locdescri,
                                hrdia, hrhorini, hrhorfin, hrcupo,
                                hrfecisys, hrfecmsys, hrhorisys, hrhormsys,
                                hrusuisys, hrusumsys, hrestisys, hrestmsys
                            ) VALUES (
                                :ciacodigo, :loccodigo, :usrcodigo, :usrcodencrip, :hrsecuen, :usrnombre, :locdescri,
                                :hrdia, :hrhorini, :hrhorfin, :hrcupo,
                                :hrfecisys, :hrfecmsys, :hrhorisys, :hrhormsys,
                                :hrusuisys, :hrusumsys, :hrestisys, :hrestmsys
                            )
                            """
                        )

                        connection.execute(
                            insert_query,
                            {
                                "ciacodigo": ciacodigo,
                                "loccodigo": loccodigo_hr,
                                "usrcodigo": usrcodigo_hr,
                                "usrcodencrip": encriptar(usrcodigo_hr),
                                "hrsecuen": hrsecuen,
                                "usrnombre": usrnombre,
                                "locdescri": locdescri,
                                "hrdia": hrdia,
                                "hrhorini": hrhorini,  # datetime
                                "hrhorfin": hrhorfin,  # datetime
                                "hrcupo": hrcupo,
                                "hrfecisys": sFecISys,  # Fecha de creación
                                "hrfecmsys": sFecISys,  # Fecha de la última modificación
                                "hrhorisys": sHorISys,  # Hora de creación
                                "hrhormsys": sHorISys,  # Hora de la última modificación
                                "hrusuisys": usrcodigo,  # Usuario que realizó la creación
                                "hrusumsys": usrcodigo,  # Usuario que realizó la última modificación
                                "hrestisys": ipUser,  # Estación de creación
                                "hrestmsys": ipUser,  # Estación de última modificación
                            },
                        )
                        msgFinal = "Eliminado exitosamente"

        return jsonify({"message": msgFinal}), 200

    except Exception as e:
        return jsonify({"error": {"msg": str(e)}}), 400
