from datetime import datetime
from decimal import Decimal

from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Localidad import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError, api_endpoint


# Definición de tamaños máximos para campos VARCHAR (schema SQL SiacDesignsoft.dbo.cgblocal)
FIELD_MAX_LENGTHS = {
    "ciacodigo": 2,
    "loccodigo": 2,
    "locdescri": 200,
    "locstatus": 1,
    "locusuisys": 10,
    "locusumsys": 10,
    "ttrcodigo": 3,
    "seqcodigo": 3,
    "sercesion": 3,
    "factippag": 3,
    "secndmig": 3,
    "secncmig": 3,
    "ndfcodigo": 3,
    "ciaruc": 15,
    "ciadirec": 200,
    "ciaciudad": 30,
    "ciapais": 30,
    "ciatelefono1": 15,
    "ciatelefono2": 15,
    "ciafax": 15,
    "ciaemail": 70,
    "ciaseccobfac": 3,
    "ciaseccobdoc": 3,
    "ciasecinvnc": 3,
    "fatrainv": 3,
    "fasumadesc": 1,
    "fatraanu": 3,
    "tipcodigo": 3,
    "forpagnd": 3,
    "vencodigo": 3,
    "zoncodigo": 3,
    "ncfcodigo": 3,
    "repbodcod": 3,
    "seqantdocgar": 3,
    "cablin1": 80,
    "cablin2": 80,
    "cablin3": 80,
    "cablin4": 80,
    "pielin1": 80,
    "pielin2": 80,
    "pielin3": 80,
    "pielin4": 80,
    "unicodigo": 3,
    "procodigo": 3,
    "regcodigo": 3,
    "bodcodpro": 3,
    "invcodpro": 2,
    "pacodingre": 3,
    "pacodegre": 3,
    "pacodingdev": 3,
    "pacodegprest": 3,
    "pacodinggar": 3,
    "pacodegrgar": 3,
    "pacodegrpro": 3,
    "painvcodgar": 2,
    "pabodcodgar": 3,
    "seqcodigonc": 3,
    "sercodigo": 3,
    "tracodproing": 3,
    "tracodproegr": 3,
    "seqcodigondm": 3,
    "sercodigondm": 3,
    "invemiped": 2,
    "forpagun": 3,
    "cencosun": 30,
    "tipordcom": 3,
    "tipclipro": 3,
    "probodcod": 3,
    "tipordcomser": 3,
    "seqndref": 3,
    "seqncmref": 3,
    "seqcobref": 3,
    "serndref": 3,
    "serncintref": 3,
    "serncref": 3,
    "paramcod1": 3,
    "paramcod2": 3,
    "paramcod3": 3,
    "paramcod4": 3,
    "paramcod5": 3,
    "paramcod6": 3,
    "tracodingloc": 3,
    "clicodingprod": 6,
    "procodingprod": 6,
    "seqcesion": 3,
    "ciaprovincia": 30,
    "tarseqnd": 3,
    "tarforpag": 3,
    "tarser00": 3,
    "tarrecau": 3,
    "tarser01": 3,
    "tarser02": 3,
    "tarser03": 3,
    "tarser04": 3,
    "tarseqndint": 3,
    "tarserint": 3,
    "tarforpagint": 3,
    "tarsecncrotdif": 3,
    "tarserncrotdif": 3,
    "tartiponccom": 3,
    "tarsecncpuntos": 3,
    "tarserncpuntos": 3,
    "tarsecant": 3,
    "tarseccob": 3,
    "cjacodigonc": 3,
    "emailsmtp": 100,
    "emailmascara": 50,
    "emailsalida": 100,
    "emailtema": 50,
    "locpathxml": 255,
    "prescodigo": 3,
    "prestipcliempl": 3,
    "presseccobro": 3,
    "pressecncmon": 3,
    "presserncmon": 3,
    "sertarpos": 3,
    "tipoingoc": 3,
    "tipoegroc": 3,
    "secantoc": 3,
    "locservidor": 1,
    "locpathxmldocemitidos": 255,
    "locpathxmldocanulados": 255,
    "ciucodigo": 3,
    "activicodigo": 3,
    "sectorcodigo": 3,
    "clivendedor": 3,
    "tbliqcaja": 3,
    "tbliqviatico": 3,
    "traegrped": 3,
    "traingped": 3,
    "bcoliqviatico": 3,
    "notapedido1": 1000,
    "notapedido2": 1000,
    "notaoc": 1000,
    "invtrapresegr": 3,
    "invtrapresing": 3,
    "sercodigotransporte": 15,
    "notacertificado": 1000,
    "clavep12": 60,
    "paramcoding": 3,
    "paramtipond": 3,
    "paramtiponc": 3,
    "paramstnd": 2,
    "paramstnc": 2,
    "paramtcnd": 6,
    "paramtcnc": 6,
    "parambodingegr": 3,
    "ctaivapagadobien": 30,
    "ctaivapagadoserv": 30,
    "emailsubject": 100,
    "parrocodigo": 6,
}

ALL_COLUMNS = [
    "ciacodigo",
    "loccodigo",
    "locdescri",
    "locstatus",
    "locfecisys",
    "lochorisys",
    "locusuisys",
    "locfecmsys",
    "lochormsys",
    "locusumsys",
    "ttrcodigo",
    "seqcodigo",
    "sercesion",
    "factippag",
    "secndmig",
    "secncmig",
    "ndfcodigo",
    "ciaruc",
    "ciadirec",
    "ciaciudad",
    "ciapais",
    "ciatelefono1",
    "ciatelefono2",
    "ciafax",
    "ciaemail",
    "ciaseccobfac",
    "ciaseccobdoc",
    "ciasecinvnc",
    "fafaccob",
    "fadesglobal",
    "fatrainv",
    "fasumadesc",
    "fanumlin",
    "fatraanu",
    "famimpser",
    "famporser",
    "famrecporval",
    "fampor1",
    "tipcodigo",
    "forpagnd",
    "vencodigo",
    "zoncodigo",
    "ncfcodigo",
    "repbodcod",
    "seqantdocgar",
    "cablin1",
    "cablin2",
    "cablin3",
    "cablin4",
    "pielin1",
    "pielin2",
    "pielin3",
    "pielin4",
    "parfecven",
    "pardiasven",
    "unicodigo",
    "procodigo",
    "regcodigo",
    "bodcodpro",
    "invcodpro",
    "pacodingre",
    "pacodegre",
    "pacodingdev",
    "pacodegprest",
    "pacodinggar",
    "pacodegrgar",
    "pacodegrpro",
    "painvcodgar",
    "pabodcodgar",
    "seqcodigonc",
    "sercodigo",
    "tracodproing",
    "tracodproegr",
    "seqcodigondm",
    "sercodigondm",
    "invemiped",
    "forpagun",
    "cencosun",
    "tipordcom",
    "tipclipro",
    "probodcod",
    "propormano",
    "proporrepuesto",
    "tipordcomser",
    "seqndref",
    "seqncmref",
    "seqcobref",
    "serndref",
    "serncintref",
    "serncref",
    "paramcod1",
    "paramcod2",
    "paramcod3",
    "paramcod4",
    "paramcod5",
    "paramcod6",
    "paramval1",
    "paramval2",
    "paramval3",
    "paramval4",
    "paramval5",
    "paramval6",
    "tracodingloc",
    "locfecinicxc",
    "clicodingprod",
    "procodingprod",
    "flagapruanti",
    "feccorpedveh",
    "seqcesion",
    "ciaprovincia",
    "tarseqnd",
    "tarforpag",
    "tarser00",
    "tarrecau",
    "tarser01",
    "tarser02",
    "tarser03",
    "tarser04",
    "tarseqndint",
    "tarserint",
    "tarforpagint",
    "tarsecncrotdif",
    "tarserncrotdif",
    "tartiponccom",
    "tarsecncpuntos",
    "tarserncpuntos",
    "tarvalcomigen",
    "tarcanapligen",
    "tarvalcomiart",
    "tarcanapliart",
    "tarsecant",
    "tarseccob",
    "cjacodigonc",
    "tardiasventrans",
    "emailsmtp",
    "emailmascara",
    "emailsalida",
    "emailtema",
    "emailmensaje",
    "locpathxml",
    "prescodigo",
    "presaplicaquin",
    "presaplicamens",
    "prestipcliempl",
    "presseccobro",
    "pressecncmon",
    "presserncmon",
    "sertarpos",
    "tipoingoc",
    "tipoegroc",
    "diasvenoc",
    "secantoc",
    "valorminimooc",
    "locservidor",
    "guianumlin",
    "locpathxmldocemitidos",
    "locpathxmldocanulados",
    "ciucodigo",
    "activicodigo",
    "sectorcodigo",
    "clivendedor",
    "tbliqcaja",
    "tbliqviatico",
    "traegrped",
    "traingped",
    "bcoliqviatico",
    "notapedido1",
    "notapedido2",
    "notaoc",
    "invtrapresegr",
    "invtrapresing",
    "sercodigotransporte",
    "notacertificado",
    "clavep12",
    "paramcoding",
    "paramtipond",
    "paramtiponc",
    "paramstnd",
    "paramstnc",
    "paramtcnd",
    "paramtcnc",
    "parambodingegr",
    "ctaivapagadobien",
    "ctaivapagadoserv",
    "emailsubject",
    "caducidadp12",
    "locflagcupon",
    "locvalcupon",
    "locfecinicupon",
    "locfecfincupon",
    "parrocodigo",
    "clidiascrs",
    "climontocrs",
]

REQUIRED_FIELDS = {"ciacodigo", "locdescri", "locstatus", "ciadirec", "locservidor"}

INT_FIELDS = {
    "fafaccob",
    "fadesglobal",
    "fanumlin",
    "famimpser",
    "famrecporval",
    "parfecven",
    "flagapruanti",
    "tarcanapligen",
    "tarcanapliart",
    "tardiasventrans",
    "presaplicaquin",
    "presaplicamens",
    "diasvenoc",
    "guianumlin",
    "locflagcupon",
    "clidiascrs",
}

DECIMAL_FIELDS = {
    "famporser",
    "fampor1",
    "pardiasven",
    "propormano",
    "proporrepuesto",
    "paramval1",
    "paramval2",
    "paramval3",
    "paramval4",
    "paramval5",
    "paramval6",
    "tarvalcomigen",
    "tarvalcomiart",
    "valorminimooc",
    "locvalcupon",
    "climontocrs",
}

DECIMAL_DEFINITIONS = {
    "famporser": (18, 2),
    "fampor1": (18, 2),
    "pardiasven": (6, 2),
    "propormano": (6, 2),
    "proporrepuesto": (6, 2),
    "paramval1": (16, 2),
    "paramval2": (16, 2),
    "paramval3": (16, 2),
    "paramval4": (16, 2),
    "paramval5": (16, 2),
    "paramval6": (16, 2),
    "tarvalcomigen": (12, 2),
    "tarvalcomiart": (12, 2),
    "valorminimooc": (18, 2),
    "locvalcupon": (12, 2),
    "climontocrs": (18, 2),
}

DATETIME_FIELDS = {
    "locfecisys",
    "lochorisys",
    "locfecmsys",
    "lochormsys",
    "locfecinicxc",
    "feccorpedveh",
    "caducidadp12",
    "locfecinicupon",
    "locfecfincupon",
}

DEFAULT_DATETIME_VALUE = datetime(1900, 1, 1)

TEXT_FIELDS = {column for column in ALL_COLUMNS if column not in INT_FIELDS and column not in DECIMAL_FIELDS and column not in DATETIME_FIELDS}

DEFAULT_ON_NULL_FIELDS = {
    "fafaccob": 0,
    "fadesglobal": 0,
    "fanumlin": 0,
    "famimpser": 0,
    "famporser": Decimal("0.00"),
    "famrecporval": 0,
    "fampor1": Decimal("0.00"),
    "parfecven": 0,
    "pardiasven": Decimal("0.00"),
    "propormano": Decimal("0.00"),
    "proporrepuesto": Decimal("0.00"),
    "paramval1": Decimal("0.00"),
    "paramval2": Decimal("0.00"),
    "paramval3": Decimal("0.00"),
    "paramval4": Decimal("0.00"),
    "paramval5": Decimal("0.00"),
    "paramval6": Decimal("0.00"),
    "flagapruanti": 0,
    "tarvalcomigen": Decimal("0.00"),
    "tarcanapligen": 0,
    "tarvalcomiart": Decimal("0.00"),
    "tarcanapliart": 0,
    "tardiasventrans": 0,
    "presaplicaquin": 0,
    "presaplicamens": 0,
    "diasvenoc": 0,
    "guianumlin": 0,
    "invtrapresegr": "",
    "invtrapresing": "",
    "locflagcupon": 0,
    "locvalcupon": Decimal("0.00"),
    "clidiascrs": 0,
    "climontocrs": Decimal("0.00"),
}


def get_default_for_field(field_name):
    if field_name in DEFAULT_ON_NULL_FIELDS:
        return DEFAULT_ON_NULL_FIELDS[field_name]
    if field_name in INT_FIELDS:
        return 0
    if field_name in DECIMAL_FIELDS:
        return Decimal("0.00")
    if field_name in DATETIME_FIELDS:
        return DEFAULT_DATETIME_VALUE
    if field_name in TEXT_FIELDS:
        return ""
    return ""


def apply_no_null_default(field_name, value):
    if value is None:
        return get_default_for_field(field_name)

    if isinstance(value, str):
        trimmed_value = value.strip()
        if trimmed_value == "":
            if field_name in INT_FIELDS or field_name in DECIMAL_FIELDS or field_name in DATETIME_FIELDS:
                return get_default_for_field(field_name)
            return ""
        return trimmed_value

    return value


def validate_field_length(field_name, field_value):
    if field_value is None or field_value == "":
        return
    max_length = FIELD_MAX_LENGTHS.get(field_name)
    if max_length is None:
        return
    value_str = str(field_value).strip()
    if len(value_str) > max_length:
        raise ValidationError(f"El campo '{field_name}' no puede exceder {max_length} caracteres. Largo proporcionado: {len(value_str)}")


def normalize_datetime(value, field_name):
    if value is None or value == "":
        return DEFAULT_DATETIME_VALUE
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        raw = value.strip()
        if raw == "":
            return None
        try:
            return datetime.fromisoformat(raw.replace("Z", "").replace("T", " "))
        except ValueError:
            pass
    raise ValidationError(f"Formato de fecha inválido para '{field_name}'")


def validate_decimal_constraints(field_name, decimal_value):
    if decimal_value is None:
        return

    definition = DECIMAL_DEFINITIONS.get(field_name)
    if not definition:
        return

    precision, scale = definition

    exponent = decimal_value.as_tuple().exponent
    current_scale = -exponent if exponent < 0 else 0
    if current_scale > scale:
        raise ValidationError(f"El campo '{field_name}' admite máximo {scale} decimales")

    max_integer_digits = precision - scale
    if abs(decimal_value) >= (Decimal(10) ** max_integer_digits):
        raise ValidationError(f"El campo '{field_name}' excede la precisión permitida ({precision},{scale})")


def normalize_value(field_name, value):
    value = apply_no_null_default(field_name, value)

    if field_name in INT_FIELDS:
        try:
            return int(value)
        except (ValueError, TypeError):
            raise ValidationError(f"El campo '{field_name}' debe ser entero")

    if field_name in DECIMAL_FIELDS:
        try:
            decimal_value = Decimal(str(value))
            validate_decimal_constraints(field_name, decimal_value)
            return decimal_value
        except (ArithmeticError, ValueError, TypeError):
            raise ValidationError(f"El campo '{field_name}' debe ser decimal")

    if field_name in DATETIME_FIELDS:
        return normalize_datetime(value, field_name)

    validate_field_length(field_name, value)
    return value


@bp.route("/crearLocalidad", methods=["POST"])
@jwt_required()
@api_endpoint
def crearLocalidad():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    data = request.get_json() or {}

    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    # ════════════════════════════════════════════════════════════════════════
    # NOT NULL sin DEFAULT (validación requerida del cliente)
    # ════════════════════════════════════════════════════════════════════════
    for field_name in REQUIRED_FIELDS:
        field_value = data.get(field_name)
        if field_value is None or str(field_value).strip() == "":
            raise ValidationError(f"{field_name} es requerido")

    ciacodigo = str(data.get("ciacodigo") or "").strip()
    loccodigo = str(data.get("loccodigo") or "").strip()

    # Auto-generar código de localidad si no se proporciona
    if not loccodigo:
        db_temp = db.session
        db.session = get_session(clicianonBD)
        engine = db.session.bind
        with engine.connect() as connection_temp:
            with connection_temp.begin():
                query = text("SELECT loccodigo FROM cgblocal WHERE ciacodigo = :ciacodigo")
                rows = connection_temp.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchall()
                numeric_codes = [int(str(row.get("loccodigo", "")).strip()) for row in rows if str(row.get("loccodigo", "")).strip().isdigit()]
                next_code = (max(numeric_codes) + 1) if numeric_codes else 1
                if next_code > 99:
                    raise ValidationError("No se puede generar más códigos de localidad (máximo 99)")
                loccodigo = str(next_code).zfill(2)
        db.session = db_temp

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            check_query = text(
                """
                SELECT 1
                FROM cgblocal
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                """
            )
            exists = connection.execute(check_query, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).first()
            if exists:
                raise ValidationError("La localidad ya existe")

            # ════════════════════════════════════════════════════════════════════════
            # Validar FK: Si no existe en siac_local_sin_licencia mandar error
            # ════════════════════════════════════════════════════════════════════════
            fk_query = text(
                """
                SELECT 1
                FROM siac_local_sin_licencia
                WHERE ciacodigo = :ciacodigo
                  AND loccodigo = :loccodigo
                """
            )
            fk_exists = connection.execute(fk_query, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).first()
            if not fk_exists:
                raise ValidationError("Se necesita de una licencia para crear una localidad")

            # ════════════════════════════════════════════════════════════════════════
            # Construcción de parámetros de inserción
            # ════════════════════════════════════════════════════════════════════════
            insert_params = {}
            for column in ALL_COLUMNS:
                if column == "locfecisys":
                    value = fecha_actual
                elif column == "lochorisys":
                    value = hora_sys
                elif column == "locusuisys":
                    value = sUsuario
                elif column == "locfecmsys":
                    value = fecha_actual
                elif column == "lochormsys":
                    value = hora_sys
                elif column == "locusumsys":
                    value = sUsuario
                else:
                    value = data.get(column)

                insert_params[column] = normalize_value(column, value)

            # Validación de longitud de todos los campos VARCHAR definidos
            for field_name in FIELD_MAX_LENGTHS.keys():
                validate_field_length(field_name, insert_params.get(field_name))

            columns_sql = ", ".join(ALL_COLUMNS)
            values_sql = ", ".join([f":{column}" for column in ALL_COLUMNS])
            insert_query = text(f"INSERT INTO cgblocal ({columns_sql}) VALUES ({values_sql})")
            connection.execute(insert_query, insert_params)

    return {"data": "Localidad creada correctamente"}
