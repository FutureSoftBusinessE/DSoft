from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
import traceback

from app.TiposCliente import bp
from app.db import get_session
from app.extensions import db
from services.encrip_desencrip import desencriptar, encriptar


# Hardcoded options from VB (quemadas)
ESTADO_CIVIL_OPTIONS = [
    {"value": "SOLTERO", "label": "SOLTERO"},
    {"value": "CASADO", "label": "CASADO"},
    {"value": "UNION LIBRE", "label": "UNION LIBRE"},
    {"value": "VIUDO", "label": "VIUDO"},
    {"value": "DIVORCIADO", "label": "DIVORCIADO"},
]

DIA_PAGO_OPTIONS = [
    {"value": 1, "label": "DOMINGO"},
    {"value": 2, "label": "LUNES"},
    {"value": 3, "label": "MARTES"},
    {"value": 4, "label": "MIERCOLES"},
    {"value": 5, "label": "JUEVES"},
    {"value": 6, "label": "VIERNES"},
    {"value": 7, "label": "SABADO"},
]

ORIGEN_INGRESOS_OPTIONS = [
    {"value": "B", "label": "EMPLEADO PUBLICO"},
    {"value": "V", "label": "EMPLEADO PRIVADO"},
    {"value": "I", "label": "INDEPENDIENTE"},
    {"value": "A", "label": "AMA DE CASA O ESTUDIANTE"},
    {"value": "R", "label": "RENTISTA"},
    {"value": "H", "label": "JUBILADO"},
    {"value": "M", "label": "REMESAS DEL EXTERIOR"},
]

PREFIJO_TELEFONO_OPTIONS = [
    {"value": "", "label": " ---- "},
    {"value": "593", "label": "+593"},
    {"value": "591", "label": "+591"},
    {"value": "56", "label": "+56"},
    {"value": "51", "label": "+51"},
    {"value": "57", "label": "+57"},
]

TIPO_IDENTIFICACION_OPTIONS = [
    {"value": "C", "label": "Cédula de Identidad"},
    {"value": "F", "label": "Consumidor Final"},
    {"value": "P", "label": "Pasaporte"},
    {"value": "R", "label": "R.U.C."},
    {"value": "O", "label": "No Aplica"},
]

TIPO_DOMICILIO_OPTIONS = [
    {"value": "P", "label": "PROPIO"},
    {"value": "A", "label": "ARRIENDA"},
    {"value": "F", "label": "FAMILIAR"},
]

TIPO_ENVIO_OPTIONS = [
    {"value": "D", "label": "Domicilio"},
    {"value": "O", "label": "Oficina"},
    {"value": "C", "label": "Casilla"},
    {"value": "F", "label": "Fax"},
]

STATUS_OPTIONS = [
    {"value": "P", "label": "POTENCIAL"},
    {"value": "A", "label": "ACTIVO"},
    {"value": "I", "label": "INACTIVO"},
]

SEXO_OPTIONS = [
    {"value": "M", "label": "Masculino"},
    {"value": "F", "label": "Femenino"},
]

PERSONA_OPTIONS = [
    {"value": "N", "label": "NATURAL"},
    {"value": "J", "label": "JURÍDICA"},
]


def get_region_options(ciacodigo, engine):
    """SELECT regcodigo, regdescri FROM cxcbreg"""
    try:
        # Only return regions for the requested company code to avoid
        # offering regcodigo values that belong to other companies.
        query = text("SELECT regcodigo AS value, regdescri AS label FROM cxcbreg WHERE ciacodigo = :ciacodigo ORDER BY regcodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_zona_options(ciacodigo, engine):
    """SELECT zoncodigo, zondescri FROM fapzona"""
    try:
        query = text("SELECT zoncodigo AS value, zondescri AS label FROM fapzona WHERE ciacodigo = :ciacodigo ORDER BY zoncodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_provincia_options(engine):
    """SELECT procodigo, prodescri FROM rhbprov"""
    try:
        query = text("SELECT procodigo AS value, prodescri AS label FROM rhbprov ORDER BY procodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_ciudad_options(engine):
    """SELECT ciucodigo, ciudescri FROM hotbciu"""
    try:
        query = text("SELECT ciucodigo AS value, ciudescri AS label FROM hotbciu ORDER BY ciucodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_actividad_options(engine):
    """SELECT activicodigo, actividescri FROM cxcbacteconomicas"""
    try:
        query = text("SELECT activicodigo AS value, actividescri AS label FROM cxcbacteconomicas ORDER BY activicodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_sector_options(engine):
    """SELECT sectorcodigo, sectordescri FROM cxcbsectorpublico"""
    try:
        query = text("SELECT sectorcodigo AS value, sectordescri AS label FROM cxcbsectorpublico ORDER BY sectorcodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_parroquia_options(engine):
    """SELECT parrocodigo, parrodescri FROM cxcbparroquia"""
    try:
        query = text("SELECT parrocodigo AS value, parrodescri AS label FROM cxcbparroquia ORDER BY parrocodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_area_options(engine):
    """SELECT areadescri FROM cxcbareas"""
    try:
        query = text("SELECT areadescri AS value, areadescri AS label FROM cxcbareas ORDER BY areadescri ASC")
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().fetchall()
        result = [dict(r) for r in rows]
        print(f"✅ Areas loaded: {len(result)} records from cxcbareas")
        return result
    except Exception as e:
        print(f"❌ Error loading areas from cxcbareas: {str(e)}")
        return []


def get_tipo_cliente_options(ciacodigo, engine):
    """SELECT tipcodigo, tipdescri FROM cxcbtipcli WHERE ciacodigo"""
    try:
        query = text("SELECT tipcodigo AS value, tipdescri AS label FROM cxcbtipcli WHERE ciacodigo = :ciacodigo ORDER BY tipcodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_usuario_options(engine):
    """SELECT usrcodigo, usrnombre FROM siaccusr WHERE usrstatus = 'A'"""
    try:
        enc_A = encriptar("A")
        query = text("SELECT usrcodigo, usrnombre FROM siaccusr WHERE usrstatus = :enc_status ORDER BY usrnombre ASC")
        with engine.connect() as connection:
            rows = connection.execute(query, {"enc_status": enc_A}).mappings().fetchall()

        result = []
        for r in rows:
            try:
                enc_code = r.get("usrcodigo")
                enc_name = r.get("usrnombre")
                value = desencriptar(enc_code) if enc_code is not None else ""
                label = desencriptar(enc_name) if enc_name is not None else ""
                result.append({"value": value, "label": label})
            except Exception:
                print("get_usuario_options: error decrypting row")
                traceback.print_exc()
                continue

        return result
    except Exception:
        traceback.print_exc()
        return []


def get_calificacion_options(engine):
    """SELECT calfcodigo, calfdescri FROM cxcbcalif"""
    try:
        query = text("SELECT calfcodigo AS value, calfdescri AS label FROM cxcbcalif ORDER BY calfcodigo ASC")
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


@bp.route("/getSelectOptions", methods=["POST"])
@cross_origin()
@jwt_required()
def getSelectOptions():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    areas_options = get_area_options(engine)

    options = {
        "estadoCivil": ESTADO_CIVIL_OPTIONS,
        "diaPago": DIA_PAGO_OPTIONS,
        "origenIngresos": ORIGEN_INGRESOS_OPTIONS,
        "prefijoTelefono": PREFIJO_TELEFONO_OPTIONS,
        "tipoIdentificacion": TIPO_IDENTIFICACION_OPTIONS,
        "tipoDomicilio": TIPO_DOMICILIO_OPTIONS,
        "tipoEnvio": TIPO_ENVIO_OPTIONS,
        "status": STATUS_OPTIONS,
        "sexo": SEXO_OPTIONS,
        "persona": PERSONA_OPTIONS,
        "region": get_region_options(sCodCia, engine),
        "zona": get_zona_options(sCodCia, engine),
        "provincia": get_provincia_options(engine),
        "ciudad": get_ciudad_options(engine),
        "actividad": get_actividad_options(engine),
        "sector": get_sector_options(engine),
        "parroquia": get_parroquia_options(engine),
        "areasdescri": areas_options,
        "areas": areas_options,
        "tipoCliente": get_tipo_cliente_options(sCodCia, engine),
        "usuario": get_usuario_options(engine),
        "calificacion": get_calificacion_options(engine),
    }

    return {"data": options}
