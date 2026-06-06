from flask import jsonify, request
from app.PlanesServicios import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError


def normalize_checkbox_to_db(value, field_name: str):
    try:
        numeric_value = int(value)
    except (ValueError, TypeError):
        raise ValidationError(f"{field_name} debe ser numérico")

    return 0 if numeric_value == 0 else -1


# Esta api crea un plan de servicios
@bp.route("/crearPlanesServicios", methods=["POST"])
@jwt_required()
@api_endpoint
def crearPlanesServicios():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # Obtener la fecha y horas
    fecha_actual = datetime.now()
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # Obtener los parámetros de la solicitud
    data = request.get_json()  # Esto permite obtener los parámetros de la consulta (URL query parameters)
    invcodigo = data.get("invcodigo")
    artcodigo = data.get("artcodigo")
    artdescri = data.get("artdescri")
    artprecventa1 = data.get("artprecventa1")
    artapliiva = data.get("artapliiva", 0)

    if not artdescri or not artcodigo or artprecventa1 is None or not invcodigo or artdescri.strip() == "" or artcodigo.strip() == "" or invcodigo.strip() == "":
        raise ValidationError("Campos requeridos: invcodigo, artcodigo, artdescri, artprecventa1, artapliiva")

    artapliiva = normalize_checkbox_to_db(artapliiva, "artapliiva")

    try:
        artprecventa1 = float(artprecventa1)
        if artprecventa1 <= 0:
            raise ValueError("El precio debe ser mayor a 0")
    except (ValueError, TypeError):
        raise ValidationError("El precio debe ser un número válido y mayor a 0")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin():
            data_inmart = {
                "ciacodigo": sCodCia,
                "invcodigo": "01",
                "artcodigo": artcodigo,
                "artdescri": artdescri,
                "artprecventa1": artprecventa1,
                "artapliiva": artapliiva,
                "lincodigo": "000000",
                "marcodigo": "S/M",
                "medcodigo": "SM",
                "precodigo": "SP",
                "artstatus": "A",
                "artalias": "",
                "artdecimal": 0,
                "artserie": 0,
                "artpeso": 0,
                "artminimo": 0,
                "artmaximo": 0,
                "artdiasrep": 0,
                "artdiasseg": 0,
                "artfrelleg": 0,
                "artcantinicial": 0,
                "artcantactual": 0,
                "artcanttranfer": 0,
                "artcantimporta": 0,
                "artprodven": -1,
                "artservicio": -1,
                "artcobraiva": 0,
                "artcostoinicial": 0,
                "artcostoactual": 0,
                "artcostoinidol": 0,
                "artcostoactdol": 0,
                "artprecventa2": 0,
                "artprecventa3": 0,
                "artprecventa4": 0,
                "artprecventa5": 0,
                "artprecventa6": 0,
                "artprevendol1": 0,
                "artprevendol2": 0,
                "artprevendol3": 0,
                "artprevendol4": 0,
                "artprevendol5": 0,
                "artprevendol6": 0,
                "artpordes": 0,
                "artmondes": 0,
                "artaplipro": 0,
                "artexpins": 0,
                "vencomision": 0,
                "refcomision": 0,
                "artfecisys": fecha_actual,
                "arthorisys": hora_sys,
                "artusuisys": sUsuario,
                "artfecmsys": fecha_actual,
                "arthormsys": hora_sys,
                "artusumsys": sUsuario,
                "artfeccos": fecha_actual,
                "arthorcos": hora_sys,
                "artusucos": "",
                "artfecpre": fecha_actual,
                "arthorpre": hora_sys,
                "artusupre": sUsuario,
                "artdesporcant": 0,
                "artdiasgarven": 0,
                "artdiasgarcom": 0,
                "artapliret": 0,
                "artporrec": 0,
                "artmonrec": 0,
                "artvehiculo": 0,
                "artimpseriecer": 0,
                "artsincosto": 0,
                "artcantcergarantia": 0,
                "artseriedesp": 0,
                "artlote": 0,
                "artfaccero": 0,
                "artstockporent": 0,
                "artporvidutil": 0,
                "artnumparte": "",
                "artvalvula": 0,
                "paiscodigo": "EC",
                "tipserie": "",
                "artmoddesc": 0,
                "sercodigo": "",
                "artconcentra": "",
                "artcantrecip": "",
                "artregissani": "",
                "artnumregsan": "",
                "artcomentari": "",
                "artetiqueta": "S",
                "artprov1": "",
                "artprov2": "",
                "artprov3": "",
                "artprov4": "",
                "artbloqueocompra": 0,
                "jefecodigo": "0000",
                "artweb": "",
                "artobserva": "",
                "artarancel": "",
                "artporpartida": 0.0,
                "artcodpartida": "",
                "artcantactualrep": 0.0,
                "artcostoactdolrep": 0.0,
                "calfcodigo": "",
                "inencodigo": "",
            }

            data_getAll = {
                "ciacodigo": sCodCia,
                "invcodigo": invcodigo,
                "artcodigo": artcodigo,
            }
            getAll = text("SELECT artcodigo FROM inmart WHERE ciacodigo = :ciacodigo AND invcodigo = :invcodigo AND artcodigo = :artcodigo")
            result = connection.execute(getAll, data_getAll).mappings().fetchone()
            if result:
                raise ValidationError("Plan de servicios ya existe")

            insert_query = text(
                """
                INSERT INTO inmart (
                    ciacodigo, invcodigo, artcodigo, artdescri,
                    lincodigo, marcodigo, medcodigo, precodigo,
                    artprecventa1, artapliiva, artstatus, artalias,
                    artdecimal, artserie, artpeso, artminimo, artmaximo,
                    artdiasrep, artdiasseg, artfrelleg,
                    artcantinicial, artcantactual, artcanttranfer, artcantimporta,
                    artprodven, artservicio, artcobraiva,
                    artcostoinicial, artcostoactual, artcostoinidol, artcostoactdol,
                    artprecventa2, artprecventa3, artprecventa4, artprecventa5, artprecventa6,
                    artprevendol1, artprevendol2, artprevendol3, artprevendol4, artprevendol5, artprevendol6,
                    artpordes, artmondes, artaplipro, artexpins,
                    vencomision, refcomision,
                    artfecisys, arthorisys, artusuisys,
                    artfecmsys, arthormsys, artusumsys,
                    artfeccos, arthorcos, artusucos,
                    artfecpre, arthorpre, artusupre,
                    artdesporcant, artdiasgarven, artdiasgarcom, artapliret, artporrec, artmonrec,
                    artvehiculo, artimpseriecer, artsincosto, artcantcergarantia, artseriedesp,
                    artlote, artfaccero, artstockporent, artporvidutil,
                    artnumparte, artvalvula, paiscodigo, tipserie, artmoddesc, sercodigo,
                    artconcentra, artcantrecip, artregissani, artnumregsan, artcomentari,
                    artetiqueta, artprov1, artprov2, artprov3, artprov4,
                    artbloqueocompra, jefecodigo, artweb, artobserva, artarancel,
                    artporpartida, artcodpartida, artcantactualrep, artcostoactdolrep, calfcodigo, inencodigo
                ) VALUES (
                    :ciacodigo, :invcodigo, :artcodigo, :artdescri,
                    :lincodigo, :marcodigo, :medcodigo, :precodigo,
                    :artprecventa1, :artapliiva, :artstatus, :artalias,
                    :artdecimal, :artserie, :artpeso, :artminimo, :artmaximo,
                    :artdiasrep, :artdiasseg, :artfrelleg,
                    :artcantinicial, :artcantactual, :artcanttranfer, :artcantimporta,
                    :artprodven, :artservicio, :artcobraiva,
                    :artcostoinicial, :artcostoactual, :artcostoinidol, :artcostoactdol,
                    :artprecventa2, :artprecventa3, :artprecventa4, :artprecventa5, :artprecventa6,
                    :artprevendol1, :artprevendol2, :artprevendol3, :artprevendol4, :artprevendol5, :artprevendol6,
                    :artpordes, :artmondes, :artaplipro, :artexpins,
                    :vencomision, :refcomision,
                    :artfecisys, :arthorisys, :artusuisys,
                    :artfecmsys, :arthormsys, :artusumsys,
                    :artfeccos, :arthorcos, :artusucos,
                    :artfecpre, :arthorpre, :artusupre,
                    :artdesporcant, :artdiasgarven, :artdiasgarcom, :artapliret, :artporrec, :artmonrec,
                    :artvehiculo, :artimpseriecer, :artsincosto, :artcantcergarantia, :artseriedesp,
                    :artlote, :artfaccero, :artstockporent, :artporvidutil,
                    :artnumparte, :artvalvula, :paiscodigo, :tipserie, :artmoddesc, :sercodigo,
                    :artconcentra, :artcantrecip, :artregissani, :artnumregsan, :artcomentari,
                    :artetiqueta, :artprov1, :artprov2, :artprov3, :artprov4,
                    :artbloqueocompra, :jefecodigo, :artweb, :artobserva, :artarancel,
                    :artporpartida, :artcodpartida, :artcantactualrep, :artcostoactdolrep, :calfcodigo, :inencodigo
                )
            """
            )

            connection.execute(insert_query, data_inmart)

    return {"data": "Plan de servicios creado exitosamente"}
