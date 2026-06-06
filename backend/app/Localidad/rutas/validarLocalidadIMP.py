import re
from datetime import datetime
from decimal import Decimal
from email.utils import parsedate_to_datetime

from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Localidad import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError, api_endpoint


# Tipos de campos para validación
INTEGER_FIELDS = {
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

BIT_FIELDS = set()

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

DEFAULT_DATETIME_VALUE = datetime(1900, 1, 1)

TEXT_FIELDS = {column for column in ALL_COLUMNS if column not in INTEGER_FIELDS and column not in DECIMAL_FIELDS and column not in DATETIME_FIELDS}

FIELD_DEFAULTS = {
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
    if field_name in FIELD_DEFAULTS:
        return FIELD_DEFAULTS[field_name]
    if field_name in INTEGER_FIELDS:
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
            if field_name in INTEGER_FIELDS or field_name in DECIMAL_FIELDS or field_name in DATETIME_FIELDS:
                return get_default_for_field(field_name)
            return ""
        return trimmed_value
    return value


# Funciones de validación por tipo de dato
def validate_integer(field, value):
    if value is None or value == "":
        return {"valid": True, "normalized": None}
    try:
        if isinstance(value, bool):
            return {"valid": False, "error": f"Debe ser un número entero, recibido: {value}"}
        return {"valid": True, "normalized": int(value)}
    except (ValueError, TypeError):
        return {"valid": False, "error": f"Debe ser un número entero, recibido: '{value}'"}


def validate_decimal(field, value):
    if value is None or value == "":
        return {"valid": True, "normalized": None}
    try:
        dec_value = Decimal(str(value))

        definition = DECIMAL_DEFINITIONS.get(field)
        if definition:
            precision, scale = definition
            exponent = dec_value.as_tuple().exponent
            current_scale = -exponent if exponent < 0 else 0
            if current_scale > scale:
                return {"valid": False, "error": f"Admite máximo {scale} decimales"}

            max_integer_digits = precision - scale
            if abs(dec_value) >= (Decimal(10) ** max_integer_digits):
                return {"valid": False, "error": f"Excede precisión permitida ({precision},{scale})"}

        return {"valid": True, "normalized": dec_value}
    except Exception:
        return {"valid": False, "error": f"Debe ser un número decimal, recibido: '{value}'"}


def validate_bit(field, value):
    if value is None or value == "":
        return {"valid": True, "normalized": 0}
    if isinstance(value, bool):
        return {"valid": True, "normalized": -1 if value else 0}
    if isinstance(value, (int, float)):
        return {"valid": True, "normalized": 0 if int(value) == 0 else -1}
    if isinstance(value, str):
        upper = value.strip().upper()
        if upper in ["1", "TRUE", "YES", "S", "SI", "T"]:
            return {"valid": True, "normalized": -1}
        if upper in ["0", "FALSE", "NO", "N", "F"]:
            return {"valid": True, "normalized": 0}
        try:
            return {"valid": True, "normalized": 0 if int(float(upper)) == 0 else -1}
        except (ValueError, TypeError):
            pass
    return {"valid": False, "error": f"Debe ser sí/no (S/N), recibido: '{value}'"}


def validate_date(field, value):
    if value is None or value == "":
        return {"valid": True, "normalized": None}
    if isinstance(value, datetime):
        return {"valid": True, "normalized": value}
    if isinstance(value, str):
        trimmed = value.strip()
        if not trimmed:
            return {"valid": True, "normalized": None}

        # Intenta parsear ISO format (YYYY-MM-DD o ISO 8601)
        iso_pattern = r"^(\d{4})-(\d{2})-(\d{2})"
        iso_match = re.match(iso_pattern, trimmed)
        if iso_match:
            try:
                return {"valid": True, "normalized": datetime.fromisoformat(trimmed.replace("Z", "").replace("T", " "))}
            except ValueError:
                pass

        # Intenta parsear RFC 2822 format (Thu, 04 Jul 2024 00:00:00 GMT)
        try:
            parsed_date = parsedate_to_datetime(trimmed)
            # Remove tzinfo para mantener solo la fecha/hora sin zona horaria
            return {"valid": True, "normalized": parsed_date.replace(tzinfo=None)}
        except (TypeError, ValueError):
            pass

        return {"valid": False, "error": f"Formato de fecha inválido: '{trimmed}' (usa YYYY-MM-DD o formato de fecha estándar)"}
    return {"valid": False, "error": "Tipo de dato inválido para fecha"}


def validate_string(field, value, max_lengths):
    if value is None:
        return {"valid": True, "normalized": None}
    if value == "":
        return {"valid": True, "normalized": ""}
    str_val = str(value).strip()
    max_len = max_lengths.get(field)
    if max_len and len(str_val) > max_len:
        return {"valid": False, "error": f"Longitud máxima: {max_len} caracteres (actual: {len(str_val)})"}
    return {"valid": True, "normalized": str_val}


def validate_field_type(field, value, max_lengths):
    if value is None or value == "":
        if field in INTEGER_FIELDS or field in DECIMAL_FIELDS:
            return {"valid": True, "normalized": None}
        if field in BIT_FIELDS:
            return {"valid": True, "normalized": 0}
        return {"valid": True, "normalized": None}

    if field in INTEGER_FIELDS:
        return validate_integer(field, value)
    if field in DECIMAL_FIELDS:
        return validate_decimal(field, value)
    if field in BIT_FIELDS:
        return validate_bit(field, value)
    if field in DATETIME_FIELDS:
        return validate_date(field, value)
    return validate_string(field, value, max_lengths)


# FUNCION DE VALIDACION PRINCIPAL
def validar_localidad(connection, columns: list, required: list, key_columns: list, rows: list):
    if not isinstance(rows, list) or len(rows) == 0:
        raise ValidationError("rows requerido")
    if not isinstance(columns, list) or len(columns) == 0:
        raise ValidationError("columns requerido")
    if not isinstance(required, list) or len(required) == 0:
        raise ValidationError("required requerido")
    if not isinstance(key_columns, list) or len(key_columns) == 0:
        raise ValidationError("key_columns requerido")

    for col in key_columns:
        if col not in columns:
            raise ValidationError(f"key_columns inválido: {col} no está en columns")
        if col not in required:
            raise ValidationError(f"key_columns inválido: {col} debe estar en required")

    for col in required:
        if col not in columns:
            raise ValidationError(f"required inválido: {col} no está en columns")

    vistos = set()

    for i, fila in enumerate(rows):
        if not isinstance(fila, dict):
            raise ValidationError(f"Fila #{i + 1} inválida: debe ser un objeto")

        fila["ok"] = True
        fila["feedback"] = ""

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
        fk_exists = connection.execute(fk_query, {"ciacodigo": fila["ciacodigo"], "loccodigo": fila["loccodigo"]}).first()
        if not fk_exists:
            fila["ok"] = False
            fila["feedback"] = "Se necesita de una licencia para crear una localidad"
            continue

        faltantes = []
        for campo in required:
            valor = fila.get(campo)
            if isinstance(valor, str):
                valor = valor.strip()
                fila[campo] = valor
            if valor is None or (isinstance(valor, str) and valor == ""):
                faltantes.append(campo)

        if faltantes:
            fila["ok"] = False
            fila["feedback"] = "Campos requeridos vacíos: " + ", ".join(faltantes)
            continue

        # Aplicar defaults no-null a TODOS los campos (no solo a FIELD_DEFAULTS)
        for campo in ALL_COLUMNS:
            v = fila.get(campo)
            fila[campo] = apply_no_null_default(campo, v)

        errores_tipo = []
        for campo in columns:
            v = fila.get(campo)
            if v is None or v == "":
                continue

            validation = validate_field_type(campo, v, FIELD_MAX_LENGTHS)
            if not validation["valid"]:
                errores_tipo.append(f"'{campo}': {validation['error']}")
            else:
                fila[campo] = validation["normalized"]

        if errores_tipo:
            fila["ok"] = False
            fila["feedback"] = "Error de tipo de dato: " + "; ".join(errores_tipo)
            continue

        errores_length = []
        for campo, max_len in FIELD_MAX_LENGTHS.items():
            v = fila.get(campo)
            if v is None or v == "":
                continue
            v_str = str(v).strip()
            if len(v_str) > max_len:
                errores_length.append(f"'{campo}' excede {max_len} caracteres (largo: {len(v_str)})")

        if errores_length:
            fila["ok"] = False
            fila["feedback"] = "Longitud inválida: " + "; ".join(errores_length)
            continue

        clave = []
        for k in key_columns:
            v = fila.get(k)
            if isinstance(v, str):
                v = v.strip()
                fila[k] = v
            clave.append("" if v is None else str(v).strip().lower())

        clave = tuple(clave)
        if clave in vistos:
            fila["ok"] = False
            fila["feedback"] = "Registro duplicado en el archivo"
            continue

        vistos.add(clave)

    cols_sql = ", ".join(key_columns)
    sql_get_all = text(f"SELECT {cols_sql} FROM cgblocal")
    rows_db = connection.execute(sql_get_all).mappings().all()

    existentes = set()
    for r in rows_db:
        clave_db = []
        for k in key_columns:
            v = r.get(k)
            if isinstance(v, str):
                v = v.strip().lower()
            clave_db.append("" if v is None else str(v).strip().lower())
        existentes.add(tuple(clave_db))

    for fila in rows:
        if not fila["ok"]:
            continue

        clave_fila = []
        for k in key_columns:
            v = fila.get(k)
            if isinstance(v, str):
                v = v.strip()
                fila[k] = v
            clave_fila.append("" if v is None else str(v).strip().lower())

        if tuple(clave_fila) in existentes:
            fila["ok"] = False
            fila["feedback"] = "Localidad ya existe"

    # Nota: La validación de FK contra siac_local_sin_licencia se realiza durante la inserción.
    # Si el registro no existe, será creado automáticamente por insertarLocalidadIMP.

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarLocalidadIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def validarLocalidadIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json() or {}
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        rows, summary = validar_localidad(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}
