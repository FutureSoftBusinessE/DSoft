from flask import request
from app.Compania import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError
import base64


def decode_base64_safe(base64_str):
    if not base64_str:
        return None
    try:
        value = str(base64_str).strip()
        if value.startswith("data:") and "," in value:
            value = value.split(",", 1)[1]
        padding = (-len(value)) % 4
        if padding:
            value += "=" * padding
        return base64.b64decode(value, validate=True)
    except Exception as exc:
        raise ValidationError(f"Error decodificando imagen base64: {exc}")


# Campos VARCHAR que se validan por longitud según tabla siaccia
TEXT_FIELD_MAX_LENGTHS = {
    "ciacodigo": 2,
    "ciadescri": 200,
    "ciadirec": 200,
    "ciasrirazon": 200,
    "ciaalias": 30,
    "ciaruc": 15,
    "ciafax": 15,
    "ciatelefono1": 15,
    "ciatelefono2": 15,
    "ciacontador": 35,
    "ciagerente": 35,
    "ciapresidente": 35,
    "ciavigilancia": 35,
    "ciaciudad": 30,
    "ciapais": 30,
    "ciaemail": 70,
    "ciaweb": 70,
    "ciasrifono": 9,
    "ciasrifax": 9,
    "ciasriemail": 60,
    "ciasriruccontador": 13,
    "ciatipoidengerente": 1,
    "ciasridirmatriz": 60,
    "ciasridocautventas": 2,
    "ciasrinotdebventas": 2,
    "ciasrinotcreventas": 2,
    "ciasriretfueventas": 5,
    "ciacodlocmatriz": 2,
    "coscodigo": 30,
    "cianumresolucion": 10,
    "ciafororg": 30,
    "ciaforcencos": 30,
    "ciaforlin": 30,
    "ciaregcont": 10,
    "ciastatus": 1,
    "ciahelpart": 1,
    "ciacantfor": 20,
    "ciacostfor": 20,
    "ciaforcta": 40,
    "ciaforpre": 30,
    "ciasecuentarjeta": 7,
    "sriagenteretencionnumres": 25,
    "ciaetiquetaadiret": 300,
    "ciavaloradiret": 300,
    "ciactapagolote": 30,
    "ciatipoocfaclote": 3,
    "ciaivaservicio": 3,
    "ciafacelectronica": 50,
    "ciapdfelectronica": 50,
    "ciaauxcredito": 35,
    "ciacedgerente": 10,
    "ciausuisys": 10,
    "ciausumsys": 10,
    "ciatipocompania": 3,
}

IMAGE_FIELDS = {"cialogo", "ciaselloagua"}

# Campos que requieren conversión de tipos
INTEGER_FIELDS_BACKEND = {
    "ciaanioejer",
    "cianivelescc",
    "cianiveleslin",
    "cianivelespre",
    "cianivelescta",
    "aplitransing",
    "apliserie",
    "codclisec",
    "codprosec",
    "codartsec",
    "ciaactualizaprecios",
    "ciaanioinicon",
    "ciadiasnc",
    "ciavalprecost",
    "ciaambienteelectronica",
    "ciasecuenemple",
    "ciasecuencargo",
    "ciasolautfactcxp",
    "ciaaproautfactcxp",
    "ciasolautanticxp",
    "ciaaproautanticxp",
    "ciasolautpagocxp",
    "ciaaproautpagocxp",
    "ciaaaocimport",
    "ciaaaocserv",
    "ciaaaocgasta",
    "ciaaaoclocal",
    "ciaaaocgastasoc",
    "ciafacitemrep",
    "ciasolautclcxp",
    "ciaaproautclcxp",
    "ciaivaporproducto",
    "ciafacDeVariosLoc",
    "cialistprecdefweb",
    "ciavalidaemp",
    "ciaaaocliqcomloc",
    "ciaaaocliqcomimp",
    "ciaaaocliqcomser",
    "ciaaaocppe",
    "ciacobrapuntos",
    "ciacobracupos",
    "ciacobrafundacion",
    "ciancbeneficiario",
    "ciainmobiliaria",
    "ciancdevcxccia",
    "CiaNivelOrg",
    "cianumvend",
    "ciavehele",
    "ciaregimenemprendedores",
    "ciaregimenpopular",
    "ciaregimengeneral",
}

DECIMAL_FIELDS_BACKEND = {"ciaporretiva", "ciaporretfuente", "ciabasepuntos", "ciasecuencliente", "ciasecuenproveedor", "ciasecuenartventa", "ciasecuenarticulo", "ciadiasretencion", "ciadiasemitirretencion"}

# Campos que DEBEN ser numéricos (lanza error si no lo son)
REQUIRED_INTEGER_FIELDS = {"ciarecsalmen"}


def convert_field_type(field_name, value):
    """Convierte un valor al tipo correcto según el campo"""
    if value is None or value == "":
        return None

    # Campos que DEBEN ser numéricos - rechazar si no lo son
    if field_name in REQUIRED_INTEGER_FIELDS:
        try:
            return int(value)
        except (ValueError, TypeError):
            raise ValidationError("El campo debe ser un número entero")

    if field_name in INTEGER_FIELDS_BACKEND:
        try:
            return int(value)
        except (ValueError, TypeError):
            return None

    if field_name in DECIMAL_FIELDS_BACKEND:
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    return value


NON_NULL_FIELDS = {
    "ciadescri",
    "ciadirec",
    "ciapresupuesto",
    "cianivelescta",
    "ciasrirazon",
    "aplitransing",
    "apliserie",
    "codclisec",
    "codprosec",
    "ciasecuencliente",
    "ciasecuenproveedor",
    "codartsec",
    "ciasecuenartventa",
    "ciasecuenarticulo",
    "ciaactualizaprecios",
    "ciasolautfactcxp",
    "ciaaproautfactcxp",
    "ciasolautanticxp",
    "ciaaproautanticxp",
    "ciasolautpagocxp",
    "ciaaproautpagocxp",
    "ciaaaocimport",
    "ciaaaocserv",
    "ciaaaocgasta",
    "ciaaaoclocal",
    "ciaaaocgastasoc",
    "ciafacitemrep",
    "ciasecuenemple",
    "ciasecuencargo",
    "ciavalprecost",
    "ciaporretiva",
    "ciaporretfuente",
    "ciaambienteelectronica",
    "srimicroempresa",
    "sricartera",
    "sriguia",
    "sriagenteretencion",
    "sricorreoffice",
    "sricopiacorreo",
    "srimensajefactura",
    "srissltls",
    "ciaaaocliqcomloc",
    "ciaaaocliqcomimp",
    "ciaaaocliqcomser",
    "ciaaaocppe",
    "ciacobrapuntos",
    "ciacobracupos",
    "ciacobrafundacion",
    "ciancbeneficiario",
    "ciainmobiliaria",
    "ciancdevcxccia",
    "ciadiasretencion",
    "ciadiasemitirretencion",
    "ciapropina",
    "ciacontabilidad",
    "ciasolautclcxp",
    "ciaaproautclcxp",
    "ciafacDeVariosLoc",
    "cialistprecdefweb",
    "ciavalidaemp",
    "ciabasepuntos",
    "ciaregimenemprendedores",
    "ciaregimenpopular",
    "ciaregimengeneral",
}

DEFAULT_ON_NULL_FIELDS = {
    "ciapresupuesto": 0,
    "cianivelescta": 0,
    "aplitransing": 0,
    "apliserie": 0,
    "codclisec": 0,
    "codprosec": 0,
    "ciasecuencliente": 0,
    "ciasecuenproveedor": 0,
    "codartsec": 0,
    "ciasecuenartventa": 0,
    "ciasecuenarticulo": 0,
    "ciaactualizaprecios": 0,
    "cianumvend": 0,
    "ciasolautfactcxp": 0,
    "ciaaproautfactcxp": 0,
    "ciasolautanticxp": 0,
    "ciaaproautanticxp": 0,
    "ciasolautpagocxp": 0,
    "ciaaproautpagocxp": 0,
    "ciaaaocimport": 0,
    "ciaaaocserv": 0,
    "ciaaaocgasta": 0,
    "ciaaaoclocal": 0,
    "ciaaaocgastasoc": 0,
    "ciafacitemrep": 0,
    "ciasecuenemple": 0,
    "ciasecuencargo": 0,
    "ciavalprecost": 0,
    "ciaporretiva": 0,
    "ciaporretfuente": 0,
    "ciaambienteelectronica": 0,
    "srimicroempresa": "N",
    "sricartera": "N",
    "sriguia": "N",
    "sriagenteretencion": "N",
    "sricorreoffice": "N",
    "sricopiacorreo": "N",
    "srimensajefactura": "N",
    "srissltls": "N",
    "ciaaaocliqcomloc": 0,
    "ciaaaocliqcomimp": 0,
    "ciaaaocliqcomser": 0,
    "ciaaaocppe": 0,
    "ciacobrapuntos": 0,
    "ciacobracupos": 0,
    "ciacobrafundacion": 0,
    "ciancbeneficiario": 0,
    "ciainmobiliaria": 0,
    "ciancdevcxccia": 0,
    "ciadiasretencion": 0,
    "ciadiasemitirretencion": 30,
    "ciapropina": 0,
    "ciacontabilidad": 1,
    "ciasolautclcxp": 0,
    "ciaaproautclcxp": 0,
    "ciaivaporproducto": 0,
    "ciafacDeVariosLoc": 0,
    "cialistprecdefweb": 1,
    "ciavalidaemp": 0,
    "ciabasepuntos": 0,
    "ciaregimenemprendedores": 0,
    "ciaregimenpopular": 0,
    "ciaregimengeneral": 0,
}

ALLOWED_UPDATE_FIELDS = {
    "ciaanioejer",
    "ciaauxcredito",
    "ciacontador",
    "ciadescri",
    "ciaalias",
    "ciaruc",
    "ciadirec",
    "ciafax",
    "ciafecminacc",
    "ciafecmsys",
    "ciaforcencos",
    "ciaforlin",
    "ciagerente",
    "ciahormsys",
    "cianivelescc",
    "cianiveleslin",
    "ciapresidente",
    "ciarecsalmen",
    "ciaregcont",
    "ciastatus",
    "ciatelefono1",
    "ciatelefono2",
    "ciausumsys",
    "ciavigilancia",
    "ciaciudad",
    "ciapais",
    "ciaescontesp",
    "ciaemail",
    "ciaweb",
    "ciaanioinicon",
    "ciaforpre",
    "cianivelespre",
    "ciadiasnc",
    "ciacedgerente",
    "ciahelpart",
    "ciacantfor",
    "ciacostfor",
    "ciavehele",
    "ciapresupuesto",
    "ciafecinipre",
    "ciaforcta",
    "cianivelescta",
    "ciasrirazon",
    "ciasrifono",
    "ciasrifax",
    "ciasriemail",
    "ciasriruccontador",
    "ciatipoidengerente",
    "ciasridirmatriz",
    "ciasridocautventas",
    "ciasrinotdebventas",
    "ciasrinotcreventas",
    "ciasriretfueventas",
    "ciacodlocmatriz",
    "generacodian",
    "coscodigo",
    "aplitransing",
    "apliserie",
    "codclisec",
    "codprosec",
    "ciasecuencliente",
    "ciasecuenproveedor",
    "ciasecuentarjeta",
    "codartsec",
    "ciasecuenartventa",
    "ciasecuenarticulo",
    "ciaactualizaprecios",
    "cianumresolucion",
    "ciafecresolucion",
    "CiaNivelOrg",
    "ciafororg",
    "cianumvend",
    "ciasolautfactcxp",
    "ciaaproautfactcxp",
    "ciasolautanticxp",
    "ciaaproautanticxp",
    "ciasolautpagocxp",
    "ciaaproautpagocxp",
    "ciaaaocimport",
    "ciaaaocserv",
    "ciaaaocgasta",
    "ciaaaoclocal",
    "ciaaaocgastasoc",
    "ciafacitemrep",
    "ciasecuenemple",
    "ciasecuencargo",
    "ciavalprecost",
    "ciaporretiva",
    "ciaporretfuente",
    "ciactapagolote",
    "ciatipoocfaclote",
    "ciaivaservicio",
    "ciafacelectronica",
    "versionfac",
    "ciapdfelectronica",
    "versionpdf",
    "ciaambienteelectronica",
    "srimicroempresa",
    "sricartera",
    "sriguia",
    "sriagenteretencion",
    "sriagenteretencionnumres",
    "sricorreoffice",
    "sricopiacorreo",
    "srimensajefactura",
    "srissltls",
    "srioffini",
    "sriofffin",
    "ciaaaocliqcomloc",
    "ciaaaocliqcomimp",
    "ciaaaocliqcomser",
    "ciaaaocppe",
    "ciacobrapuntos",
    "ciacobracupos",
    "ciacobrafundacion",
    "ciancbeneficiario",
    "ciainmobiliaria",
    "ciancdevcxccia",
    "ciadiasretencion",
    "ciadiasemitirretencion",
    "ciapropina",
    "ciacontabilidad",
    "ciaetiquetaadiret",
    "ciavaloradiret",
    "ciasolautclcxp",
    "ciaaproautclcxp",
    "cialogo",
    "ciaselloagua",
    "ciaivaporproducto",
    "ciafacDeVariosLoc",
    "cialistprecdefweb",
    "ciavalidaemp",
    "ciabasepuntos",
    "ciatipocompania",
    "ciaregimenemprendedores",
    "ciaregimenpopular",
    "ciaregimengeneral",
}


def validate_field_length(field_name, field_value):
    if field_value is None or field_value == "":
        return
    max_length = TEXT_FIELD_MAX_LENGTHS.get(field_name)
    if max_length is None:
        return
    value_str = str(field_value)
    if len(value_str) > max_length:
        raise ValidationError(f"El campo '{field_name}' no puede exceder {max_length} caracteres. " f"Largo proporcionado: {len(value_str)}")


@bp.route("/editarCompania", methods=["POST"])
@jwt_required()
@api_endpoint
def editarCompania():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        raise ValidationError("Body inválido")

    ciacodigo = str(data.get("ciacodigo") or "").strip()
    if not ciacodigo:
        raise ValidationError("ciacodigo es requerido")
    validate_field_length("ciacodigo", ciacodigo)

    # El código no puede ser modificado en edición
    if "ciacodigo" in data and str(data.get("ciacodigo", "")).strip() != ciacodigo:
        raise ValidationError("El código de compañía no puede ser modificado")

    update_values = {}
    for field_name, value in data.items():
        if field_name == "ciacodigo" or field_name not in ALLOWED_UPDATE_FIELDS:
            continue

        if value is None and field_name in NON_NULL_FIELDS:
            if field_name in DEFAULT_ON_NULL_FIELDS:
                value = DEFAULT_ON_NULL_FIELDS[field_name]
            else:
                raise ValidationError(f"El campo '{field_name}' no puede ser null")

        if field_name in IMAGE_FIELDS:
            value = decode_base64_safe(value)
        if field_name in TEXT_FIELD_MAX_LENGTHS:
            validate_field_length(field_name, value)

        # Conversión de tipos: INT, DECIMAL, etc.
        if field_name not in IMAGE_FIELDS:
            value = convert_field_type(field_name, value)

        update_values[field_name] = value

    update_values["ciafecmsys"] = fecha_actual
    update_values["ciahormsys"] = hora_sys
    update_values["ciausumsys"] = sUsuario

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    with engine.connect() as connection:
        with connection.begin() as trans:
            check_query = text("SELECT ciacodigo FROM siaccia WHERE ciacodigo = :ciacodigo")
            existing = connection.execute(check_query, {"ciacodigo": ciacodigo}).mappings().fetchone()
            if not existing:
                raise ValidationError(f"No existe ninguna compañía con ciacodigo '{ciacodigo}'.")

            set_clause = ", ".join([f"{field_name} = :{field_name}" for field_name in update_values])
            update_query = text(f"UPDATE siaccia SET {set_clause} WHERE ciacodigo = :ciacodigo")
            update_values["ciacodigo"] = ciacodigo
            connection.execute(update_query, update_values)
            trans.commit()

    return {"data": "Compañía actualizada correctamente"}
