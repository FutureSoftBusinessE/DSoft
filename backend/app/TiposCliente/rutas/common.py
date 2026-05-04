from datetime import datetime
from services.encrip_desencrip import encriptar

# ============================================================================
# FIELD TYPE DEFINITIONS - Used for validation and normalization
# ============================================================================

# Integer fields - must be convertible to int
INTEGER_FIELDS = {
    "clicodigo",  # Primary key (stored as text but numeric)
    "clidiascrs",  # Credit days
    "cliprefac",  # Preferred list
    "clidiascrd",  # Credit days debit
    "clidiapago",  # Payment day
    "clidiasrecibefac1",  # Invoice receive days 1
    "clidiaentregafac",  # Invoice delivery days
    "clicuotaven",  # PendingQuotas count
    "cliconespecial",  # Special contract (0/1)
    "cliivaped",  # IVA requested (0/1)
}

# Decimal fields - must be convertible to float
DECIMAL_FIELDS = {
    "climontocrs",  # Credit mount
    "clisalaplis",  # Salary applicable
    "climontocrd",  # Credit amount debit
    "clisalaplid",  # Salary applicable debit
    "cliactivos",  # Assets
    "clipasivos",  # Liabilities
    "cliingresos",  # Income
    "cliegresos",  # Expenses
    "clipatrimonioneto",  # Net worth
    "convalviaje",  # Contact travel value
}

# DateTime fields - must NOT be converted to empty strings, keep as None or datetime objects
DATETIME_FIELDS = {
    "clifecisys",  # Date created
    "confecisys",  # Contact date created
    "agefecisys",  # Agency date created
    "obsfecisys",  # Observation date created (historial)
    "conhorisys",  # Contact hour created
    "agehorisys",  # Agency hour created
    "obshorisys",  # Observation hour created (historial)
    "venfecisys",  # Venta date created
    "venhorisys",  # Venta hour created
}

# Boolean fields - must be 0, 1, True, False, or string "0"/"1"
BIT_FIELDS = {
    "cliapliiva",  # Apply IVA (0/1)
    "clibloqueo",  # Blocked (0/1)
    "calificacion",  # Qualification (0/1)
    "cliconespecial",  # Special contract (0/1)
    "cliivaped",  # IVA requested (0/1)
    "clidemanda",  # Lawsuit (0/1)
    "clicastigada",  # Punished (0/1)
    "cliparterel",  # Related party (0/1)
}


def normalize_null_values(payload):
    """
    Normalize None/NULL values based on field data type + defaults.
    FK fields with empty strings are converted to NULL (SQL Server FK constraint allows NULL, not empty strings).
    DateTime fields are preserved as-is (datetime objects or None).
    Priority: DEFAULT_FIELDS > FK handling > type-based normalization > keep as-is for datetime
    """
    # FK fields that must be NULL if empty (to pass FK constraints)
    FK_FIELDS = {"zoncodigo", "regcodigo", "procodigo", "ciucodigo", "activicodigo", "sectorcodigo", "activicodigocon", "capcodigo", "paicodigonac", "parrocodigo", "apocodigo", "usrcodigo", "tipcodigo", "calfcodigo", "areadescri"}

    for key, value in payload.items():
        # DateTime fields: don't touch them, keep as datetime objects or None
        if key in DATETIME_FIELDS:
            continue

        if value is None:
            # None value handling
            if key in DEFAULT_FIELDS:
                payload[key] = DEFAULT_FIELDS[key]
            elif key in INTEGER_FIELDS or key in DECIMAL_FIELDS:
                payload[key] = 0
            else:
                # Non-FK fields: convert None to empty string
                if key not in FK_FIELDS:
                    payload[key] = ""
                # FK fields: keep as None (NULL in DB)
        elif value == "":
            # Empty string handling
            if key in DEFAULT_FIELDS:
                payload[key] = DEFAULT_FIELDS[key]
            elif key in FK_FIELDS:
                # FK fields with empty string: convert to None (NULL in DB)
                # SQL Server FK constraint allows NULL but not empty strings for lookup
                payload[key] = None
            # Otherwise keep empty string
        # else: keep the value as is

    return payload


def parse_date(date_value):
    """
    Convierte varios formatos de fecha a un objeto datetime válido para SQL Server.
    Soporta:
    - ISO date string: "2026-04-14"
    - ISO datetime string: "2026-04-14T00:00:00"
    - HTTP/RFC2822 date string: "Tue, 14 Apr 2026 00:00:00 GMT"
    - datetime objects (retorna como está)
    - None o vacío (retorna None)
    """
    if not date_value:
        return None

    # Si ya es datetime, devolverlo
    if isinstance(date_value, datetime):
        return date_value.replace(hour=0, minute=0, second=0, microsecond=0)

    # Convertir a string si no lo es
    date_str = str(date_value).strip() if date_value else None
    if not date_str:
        return None

    # Intentar varios formatos de parseo
    formats = [
        "%Y-%m-%d",  # ISO date: 2026-04-14
        "%Y-%m-%dT%H:%M:%S",  # ISO datetime: 2026-04-14T00:00:00
        "%Y-%m-%dT%H:%M:%S.%f",  # ISO datetime con microseconds
        "%Y-%m-%d %H:%M:%S",  # Common datetime: 2026-04-14 00:00:00
        "%d/%m/%Y",  # Spanish date: 14/04/2026
        "%d-%m-%Y",  # Spanish date alt: 14-04-2026
    ]

    for fmt in formats:
        try:
            parsed = datetime.strptime(date_str, fmt)
            return parsed.replace(hour=0, minute=0, second=0, microsecond=0)
        except ValueError:
            continue

    # Si falla con formatos simples, intentar RFC 2822 (HTTP date)
    try:
        from email.utils import parsedate_to_datetime

        parsed = parsedate_to_datetime(date_str)
        return parsed.replace(hour=0, minute=0, second=0, microsecond=0)
    except Exception:
        pass

    # Si todo falla, loguear y retornar None
    print(f"WARNING: Could not parse date: {date_value}")
    return None


TABLE_NAME = "cxcmcli"
PRIMARY_KEYS = ["ciacodigo", "clicodigo"]

ALL_COLUMNS = [
    "ciacodigo",
    "clicodigo",
    "clinombre",
    "cliaparta",
    "cliruc",
    "clidirec",
    "clirepres",
    "clitelef1",
    "clitelef2",
    "clifax",
    "clidiascrs",
    "climontocrs",
    "clisalaplis",
    "clidiascrd",
    "climontocrd",
    "clisalaplid",
    "cliprefac",
    "clistatus",
    "clifecisys",
    "clihorisys",
    "cliusuisys",
    "clifecmsys",
    "clihormsys",
    "cliusumsys",
    "zoncodigo",
    "regcodigo",
    "cliapliiva",
    "procodigo",
    "cliestciv",
    "cliprofesion",
    "tipcodigo",
    "clibloqueo",
    "cliobserva",
    "clifecnac",
    "cliemail",
    "calificacion",
    "website",
    "cliidencon",
    "clidirec2",
    "ciucodigo",
    "usrcodigo",
    "cliruccon",
    "clinombrecon",
    "clidireccon",
    "cliprofesioncon",
    "cliivaped",
    "clirucmatriz",
    "clinommatriz",
    "cliintersec",
    "clinumestable",
    "tarenviosta",
    "clirucrepres",
    "cliidentifica",
    "fecenvioxml",
    "cliidenrep",
    "clicuotaven",
    "activicodigo",
    "sectorcodigo",
    "clidiapago",
    "clihorapagodesde",
    "clihorapagohasta",
    "clidiasrecibefac1",
    "clidiaentregafac",
    "cliestisys",
    "cliestmsys",
    "cliconespecial",
    "clitelpref1",
    "clitelpref2",
    "clitelext1",
    "clitelext2",
    "calfcodigo",
    "clisexo",
    "clipersona",
    "cliorigening",
    "clidemanda",
    "clicastigada",
    "parrocodigo",
    "cliparterel",
    "clitipodomicilio",
    "clitiempodomicilio",
    "cliubicacionrapido",
    "clireferencia1",
    "cliparentesco1",
    "clireftelefono1",
    "clireferencia2",
    "cliparentesco2",
    "clireftelefono2",
    "paicodigonac",
    "clilugarlabora",
    "cliactivos",
    "clipasivos",
    "cliingresos",
    "cliegresos",
    "clipatrimonioneto",
    "capcodigo",
    "clifonocon",
    "cliemailcon",
    "activicodigocon",
    "cliingresoscon",
    "cliesfuncionario",
    "cliinstitfuncionario",
    "clienpolitica",
    "clipartidopolitico",
    "clifondosorigen",
    "clifondosdestino",
    "clifonorepres",
    "clidirecrepres",
    "cliemailrepres",
    "apocodigo",
    "clifonolabora",
    "clicontactonombre",
    "clicontactoemail",
    "clipaicodigocon",
    "clicertvotacion",
    "clicertvotacioncon",
]

# Field metadata extracted from SQLAlchemy models - used for data validation
VARCHAR_MAX_LENGTHS = {
    "ciacodigo": 2,
    "clicodigo": 6,
    "clinombre": 200,
    "cliaparta": 40,
    "cliruc": 15,
    "clidirec": 200,
    "clirepres": 60,
    "clitelef1": 15,
    "clitelef2": 15,
    "clifax": 15,
    "clistatus": 1,
    "cliusuisys": 10,
    "cliusumsys": 10,
    "zoncodigo": 3,
    "regcodigo": 3,
    "procodigo": 3,
    "cliestciv": 15,
    "cliprofesion": 40,
    "tipcodigo": 3,
    "cliobserva": 1000,
    "cliemail": 100,
    "calificacion": 1,
    "website": 100,
    "cliidencon": 1,
    "clidirec2": 150,
    "ciucodigo": 3,
    "usrcodigo": 10,
    "cliruccon": 15,
    "clinombrecon": 60,
    "clidireccon": 100,
    "cliprofesioncon": 40,
    "clirucmatriz": 15,
    "clinommatriz": 200,
    "cliintersec": 60,
    "clinumestable": 10,
    "tarenviosta": 1,
    "clirucrepres": 15,
    "cliidentifica": 1,
    "cliidenrep": 1,
    "activicodigo": 3,
    "sectorcodigo": 3,
    "cliestisys": 40,
    "cliestmsys": 40,
    "clitelpref1": 5,
    "clitelpref2": 5,
    "clitelext1": 5,
    "clitelext2": 5,
    "calfcodigo": 15,
    "clisexo": 1,
    "clipersona": 1,
    "cliorigening": 1,
    "parrocodigo": 6,
    "clitipodomicilio": 1,
    "clitiempodomicilio": 20,
    "cliubicacionrapido": 200,
    "clireferencia1": 150,
    "cliparentesco1": 50,
    "clireftelefono1": 15,
    "clireferencia2": 150,
    "cliparentesco2": 50,
    "clireftelefono2": 15,
    "paicodigonac": 10,
    "clilugarlabora": 200,
    "capcodigo": 10,
    "clifonocon": 15,
    "cliemailcon": 100,
    "activicodigocon": 3,
    "clifondosorigen": 100,
    "clifondosdestino": 100,
    "clifonorepres": 15,
    "clidirecrepres": 100,
    "cliemailrepres": 100,
    "apocodigo": 255,
    "clifonolabora": 15,
    "clicontactonombre": 200,
    "clicontactoemail": 100,
    "clipaicodigocon": 10,
    "clicertvotacion": 20,
    "clicertvotacioncon": 20,
    # Campos de tablas relacionadas
    "vencodigo": 10,
    "loccodigo": 3,
    "bcotipo": 1,
    "bcocodigo": 3,
    "bconumcta": 20,
    "boccalifi": 1,
    "agencodigo": 3,
    "agendescri": 150,
    "agendirec": 100,
    "agentelpref1": 5,
    "agentelpref2": 5,
    "agentelext1": 5,
    "agentelext2": 5,
    "agenemail": 100,
    "agenstatus": 30,
    "agecodrelext": 4,
    "condescri": 60,
    "contelef1": 15,
    "contelef2": 15,
    "concelular": 15,
    "conemail": 100,
    "concomenta": 100,
    "concargo": 100,
    "areadescri": 60,
    "constatus": 1,
    "contelpref1": 5,
    "contelpref2": 5,
    "contelext1": 5,
    "contelext2": 5,
    "concodrelext": 4,
    "lincodigo": 3,
    "marcodigo": 3,
    "artcodigo": 3,
    "invcodigo": 3,
    "obssecuen": 5,
    "obsobserva": 500,
}

INTEGER_FIELDS = {
    "clidiascrs",
    "clidiascrd",
    "cliprefac",
    "cliapliiva",
    "clibloqueo",
    "cliivaped",
    "clicuotaven",
    "clidiapago",
    "clidiasrecibefac1",
    "clidiaentregafac",
    "cliconespecial",
    "cliparterel",
}

DECIMAL_FIELDS = {
    # Precision (18, 2) - cxcmcli main table
    "climontocrs",
    "clisalaplis",
    "climontocrd",
    "clisalaplid",
    "cliactivos",
    "clipasivos",
    "cliingresos",
    "cliegresos",
    "clipatrimonioneto",
    "cliingresoscon",
    # Precision (15, 2) - smaller decimals
    "clidemanda",
    "clicastigada",
    # Precision (16, 6) - high precision discounts
    "desporcentaje",
    # Precision (12, 2) - travel allowance
    "convalviaje",
}

BIT_FIELDS = {"cliesfuncionario", "clienpolitica"}

DATETIME_FIELDS = {
    "clifecisys",
    "clihorisys",
    "clifecmsys",
    "clihormsys",
    "clifecnac",
    "fecenvioxml",
    "clihorapagodesde",
    "clihorapagohasta",
    "venfecisys",
    "venhorisys",
    "bcofecape",
    "bcofemsys",
    "bcohormsys",
    "agenfecisys",
    "agenhorisys",
    "confecisys",
    "conhorisys",
    "desfecisys",
    "deshorisys",
    "desfecmsys",
    "deshormsys",
    "obsfecisys",
    "obshorisys",
}

DEFAULT_FIELDS = {
    # cxcmcli defaults
    "clidiascrs": 0,
    "climontocrs": 0,
    "clisalaplis": 0,
    "clidiascrd": 0,
    "climontocrd": 0,
    "clisalaplid": 0,
    "cliprefac": 1,
    "cliapliiva": 0,
    "clibloqueo": 0,
    "calificacion": "0",
    "cliidencon": "O",
    "cliivaped": 0,
    "tarenviosta": "D",
    "cliidentifica": "C",
    "cliidenrep": "O",
    "clicuotaven": 0,
    "clidiapago": 0,
    "clidiasrecibefac1": 0,
    "clidiaentregafac": 0,
    "cliconespecial": 0,
    "clipersona": "N",
    "cliorigining": "I",
    "clidemanda": 0,
    "clicastigada": 0,
    "cliparterel": 0,
    "usrcodigo": "",  # Credit officer - NULL is allowed but default to empty
    # Related tables defaults
    "agecodrelext": "",
    "concodrelext": "",
    "convalviaje": 0,
    "desporcentaje": 0,
    "deslistaprecio": 1,
    "bcotipo": "B",
    "tarjorigen": "MANUAL",
    "tarjtipo": "C",
}

# Fields that are NOT NULL (with or without defaults) - SEPARATED BY TABLE
# IMPORTANT: Each field's nullability is determined by the table context
NOT_NULL_FIELDS_CXCMCLI = {
    "ciacodigo",
    "clicodigo",
    "clinombre",
    "clidirec",
    "clistatus",
    "cliusuisys",
    "cliusumsys",
    "cliapliiva",
    "clibloqueo",
    "calificacion",
    "cliidencon",
    "cliivaped",
    "tarenviosta",
    "cliidentifica",
    "cliidenrep",
    "clicuotaven",
    "clidiapago",
    "clidiasrecibefac1",
    "clidiaentregafac",
    "cliconespecial",
    "clipersona",
    "cliorigining",
    "clidemanda",
    "clicastigada",
    "cliparterel",
    # FK fields are optional - VB allows empty strings, DB validates
    # "clinommatriz",  # Can be empty if no matrix exists
}

NOT_NULL_FIELDS_CXCTCLIVEN = {
    "vencodigo",
    "loccodigo",
    "venfecisys",
    "venhorisys",
    "venusuisys",
    "venestisys",
}

NOT_NULL_FIELDS_CXCTCLIREFERENCIAS = {
    "bcocodigo",
    "bcotipo",
    "bconumcta",
    "bcofecape",
    "boccalifi",
    "bcofemsys",
    "bcohormsys",
    "bcousumsys",
    "bcoestmsys",
}

NOT_NULL_FIELDS_CXCTCLIAGENCIAS = {
    "agencodigo",
    "agendirec",
    "agentelef1",
    "agentelef2",
    "agenemail",
    "agenfecisys",
    "agenhorisys",
    "agenusuisys",
    "agenestisys",
    "ciucodigo",  # CRITICAL: City code required by DB - no NULL allowed
    # FK fields are optional - allow empty strings
    # "zoncodigo",
    # "regcodigo",
    # "procodigo",
    "agecodrelext",
}

NOT_NULL_FIELDS_CXCTCLICONTACTOS = {
    "agencodigo",
    "condescri",
    "contelef1",
    "contelef2",
    "concelular",
    "conemail",
    "concomenta",
    "concargo",
    "areadescri",
    "confecisys",
    "conhorisys",
    "conusuisys",
    "conestisys",
    "concodrelext",
    "convalviaje",
}

NOT_NULL_FIELDS_CXCBCLIDESC = {
    "lincodigo",
    "marcodigo",
    "deslistaprecio",
    "desfecisys",
    "deshorisys",
    "desusuisys",
    "desestisys",
    "desfecmsys",
    "deshormsys",
    "desusumsys",
    "desestmsys",
}

NOT_NULL_FIELDS_CXCBCLIDESCART = {
    "invcodigo",
    "artcodigo",
    "deslistaprecio",
    "desfecisys",
    "deshorisys",
    "desusuisys",
    "desestisys",
    "desfecmsys",
    "deshormsys",
    "desusumsys",
    "desestmsys",
}

NOT_NULL_FIELDS_CXCTCLIHISTORIAL = {
    "ciacodigo",
    "clicodigo",
    "obssecuen",
    "obsobserva",
    "obsfecisys",
    "obshorisys",
}

# Default map for cxcmcli (main table) - used when table context not specified
NOT_NULL_FIELDS = NOT_NULL_FIELDS_CXCMCLI


# CRITICAL REQUIREMENT: Never allow NULL in database - only empty strings "" or valid defaults
# This applies to ALL fields including Foreign Keys and NOT NULL columns
# Empty strings and defaults are validated before database insert


NOT_NULL_NO_DEFAULT_FIELDS = {"ciacodigo", "clicodigo", "clinombre", "clidirec"}


ALLOWED_UPDATE_FIELDS = [column for column in ALL_COLUMNS if column not in PRIMARY_KEYS and column not in {"clifecisys", "clihorisys", "cliusuisys"}]


# ============================================================================
# DATA VALIDATION FUNCTIONS - Enforce data integrity before DB insert/update
# ============================================================================


def validate_field_length(field_name, value):
    """Validate VARCHAR field length against max allowed"""
    if field_name not in VARCHAR_MAX_LENGTHS:
        return  # Field not in constraints list (not a VARCHAR)

    if value is None or value == "":
        return  # Empty values handled separately by normalize_null_values()

    max_length = VARCHAR_MAX_LENGTHS[field_name]
    if isinstance(value, str) and len(value) > max_length:
        raise ValueError(f"Field '{field_name}': Exceeds max length {max_length}. " f"Received {len(value)} characters: '{value[:50]}...'")


def truncate_field_to_max_length(field_name, value):
    """Truncate field values to maximum allowed length"""
    if value is None or value == "":
        return value

    if field_name not in VARCHAR_MAX_LENGTHS:
        return value  # Field not in constraints list

    max_length = VARCHAR_MAX_LENGTHS[field_name]
    if isinstance(value, str) and len(value) > max_length:
        truncated = value[:max_length]
        print(f"WARNING: Field '{field_name}' truncated from {len(value)} to {max_length} chars: '{value}' -> '{truncated}'")
        return truncated

    return value


def validate_not_null(field_name, value, table_context="cxcmcli"):
    """Validate NOT NULL constraint enforcement - context-aware"""
    # Map table context to corresponding NOT NULL field set
    not_null_map = {
        "cxcmcli": NOT_NULL_FIELDS_CXCMCLI,
        "cxctcliven": NOT_NULL_FIELDS_CXCTCLIVEN,
        "cxctclireferencias": NOT_NULL_FIELDS_CXCTCLIREFERENCIAS,
        "cxctcliagencias": NOT_NULL_FIELDS_CXCTCLIAGENCIAS,
        "cxctclicontactos": NOT_NULL_FIELDS_CXCTCLICONTACTOS,
        "cxcbclidesc": NOT_NULL_FIELDS_CXCBCLIDESC,
        "cxcbclidescart": NOT_NULL_FIELDS_CXCBCLIDESCART,
        "cxctclihistorial": NOT_NULL_FIELDS_CXCTCLIHISTORIAL,
    }

    not_null_fields = not_null_map.get(table_context, NOT_NULL_FIELDS)

    if field_name not in not_null_fields:
        return  # Field is allowed to be NULL

    # If field is NOT NULL and has a default, it's OK to be empty
    if field_name in DEFAULT_FIELDS:
        return  # Will be filled with default

    # Field is NOT NULL - reject only actual null (None), empty string "" is valid
    if value is None:
        raise ValueError(f"Field '{field_name}': NOT NULL constraint violated (table: {table_context}). " f"Cannot be null - use empty string '' if no value.")


def validate_field_type(field_name, value):
    """Validate and convert field data type - with automatic type coercion where safe"""
    if value is None or value == "":
        return value  # NULL/empty handled by normalize_null_values()

    # Integer fields should be numbers or convertible to numbers
    if field_name in INTEGER_FIELDS:
        if isinstance(value, bool):
            if field_name in BIT_FIELDS:
                return -1 if value else 0
            return 1 if value else 0
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            # Try to convert string to int
            try:
                return int(float(value))  # int(float()) handles "123.45" → 123
            except (ValueError, TypeError):
                raise ValueError(f"Field '{field_name}': Expected integer, got invalid text '{value}'. " f"Please enter a number like '0', '30', '100', etc.")
        return value

    # Decimal fields should be numeric
    if field_name in DECIMAL_FIELDS:
        if isinstance(value, (int, float)):
            return value
        if isinstance(value, str):
            # Try to convert string to float
            try:
                return float(value)
            except (ValueError, TypeError):
                raise ValueError(f"Field '{field_name}': Expected decimal/numeric, got invalid text '{value}'. " f"Please enter a number like '0', '5000', '9999.99', etc.")
        return value

    # Boolean fields should be 0/1, True/False, or '0'/'1'
    if field_name in BIT_FIELDS:
        if isinstance(value, bool):
            return -1 if value else 0
        if isinstance(value, (int, float)):
            return 0 if int(value) == 0 else -1
        if isinstance(value, str):
            trimmed = value.strip()
            upper = trimmed.upper()
            if upper in ("TRUE", "T", "S", "SI", "YES", "Y"):
                return -1
            if upper in ("FALSE", "F", "N", "NO"):
                return 0
            try:
                numeric_value = int(float(trimmed))
                return 0 if numeric_value == 0 else -1
            except (ValueError, TypeError):
                pass
        raise ValueError(f"Field '{field_name}': Expected boolean-like value, got '{value}'. " f"Use 0 for false/unchecked and any non-zero for true/checked.")

    return value


def validate_payload(payload, table_context="cxcmcli"):
    """Validate all fields in a payload dict - context-aware validation"""
    for field_name, value in payload.items():
        # First check NOT NULL constraints (context-aware)
        try:
            validate_not_null(field_name, value, table_context)
        except ValueError as e:
            raise ValueError(f"{str(e)}")

        # Skip further validation for NULL/empty values
        if value is None or value == "":
            continue

        # Validate length for VARCHAR fields
        try:
            validate_field_length(field_name, value)
        except ValueError as e:
            raise ValueError(f"{str(e)}")

        # Validate data type consistency
        try:
            validate_field_type(field_name, value)
        except ValueError as e:
            raise ValueError(f"{str(e)}")


def prepare_insert_payload(data, user_name):
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    payload = {}
    for column in ALL_COLUMNS:
        value = data.get(column)
        # If no value provided, use defaults
        if value is None:
            value = DEFAULT_FIELDS.get(column)

        # Validate and convert field types (important for numeric/boolean fields)
        if value is not None and value != "":
            try:
                converted_value = validate_field_type(column, value)
                payload[column] = converted_value
            except ValueError as e:
                raise ValueError(f"Error in field '{column}': {str(e)}")
        else:
            payload[column] = value

    payload["clifecisys"] = now_date
    payload["clihorisys"] = now_hour
    payload["cliusuisys"] = user_name
    payload["clifecmsys"] = now_date
    payload["clihormsys"] = now_hour
    payload["cliusumsys"] = user_name

    # Ensure fields that must be stored encrypted are encrypted
    try:
        if payload.get("usrcodigo"):
            payload["usrcodigo"] = encriptar(str(payload["usrcodigo"]))
    except Exception:
        pass

    # Normalize NULL values to prevent DB constraint violations
    normalize_null_values(payload)

    return payload


def prepare_update_payload(data, existing_row, user_name):
    payload = {}

    for field_name in ALLOWED_UPDATE_FIELDS:
        # Get value from data first, then existing_row, then defaults
        value = data.get(field_name)
        if value is None:
            value = existing_row.get(field_name)
        if value is None:
            value = DEFAULT_FIELDS.get(field_name)

        # Validate and convert field types (important for numeric/boolean fields)
        if value is not None and value != "":
            try:
                converted_value = validate_field_type(field_name, value)
                payload[field_name] = converted_value
            except ValueError as e:
                # Re-raise validation errors with clear context
                raise ValueError(f"Error in field '{field_name}': {str(e)}")
        else:
            payload[field_name] = value

    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)
    payload["clifecmsys"] = now_date
    payload["clihormsys"] = now_hour
    payload["cliusumsys"] = user_name

    # Ensure fields that must be stored encrypted are encrypted
    try:
        if payload.get("usrcodigo"):
            payload["usrcodigo"] = encriptar(str(payload["usrcodigo"]))
    except Exception:
        pass

    # Normalize NULL values to prevent DB constraint violations
    normalize_null_values(payload)

    return payload


def prepare_vendedores_inserts(data, sCodCia, clicodigo, user_name, estacion):
    """Prepare INSERT statements for vendedores (cxctcliven)"""
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    inserts = []
    vendedores = data.get("vendedores", [])
    if not isinstance(vendedores, list):
        return inserts

    for item in vendedores:
        if not item:
            continue
        # Map frontend field names to backend field names
        vencodigo = (item.get("vencodigo") or item.get("codigo", "")).strip()
        if not vencodigo:
            continue
        insert_dict = {
            "ciacodigo": sCodCia,
            "clicodigo": clicodigo,
            "vencodigo": truncate_field_to_max_length("vencodigo", vencodigo),
            "loccodigo": truncate_field_to_max_length("loccodigo", (item.get("loccodigo") or item.get("local", "")).strip()),
            "venfecisys": now_date,
            "venhorisys": now_hour,
            "venusuisys": user_name,
            "venestisys": estacion,
        }
        normalize_null_values(insert_dict)
        inserts.append(insert_dict)

    return inserts


def prepare_referencias_inserts(data, sCodCia, clicodigo, user_name, estacion):
    """Prepare INSERT statements for referencias bancarias (cxctclireferencias)"""
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    inserts = []
    referencias = data.get("refBancarias", [])
    if not isinstance(referencias, list):
        return inserts

    for item in referencias:
        if not item:
            continue

        # Map frontend field names to backend field names
        bcocodigo = item.get("bcocodigo") or item.get("codigo", "")
        if not bcocodigo or not bcocodigo.strip():
            continue

        # Parse fecha de apertura (puede venir como string en varios formatos)
        fecha_apertura = parse_date(item.get("bcofecape") or item.get("fechaApertura"))

        insert_dict = {
            "ciacodigo": sCodCia,
            "clicodigo": clicodigo,
            "bcocodigo": truncate_field_to_max_length("bcocodigo", bcocodigo.strip()),
            "bcotipo": truncate_field_to_max_length("bcotipo", (item.get("bcotipo") or item.get("tipoCuenta", "")).strip()),
            "bconumcta": truncate_field_to_max_length("bconumcta", (item.get("bconumcta") or item.get("numero", "")).strip()),
            "bcofecape": fecha_apertura,
            "boccalifi": truncate_field_to_max_length("boccalifi", (item.get("boccalifi") or item.get("calificacion", "")).strip()),
            "bcofemsys": now_date,
            "bcohormsys": now_hour,
            "bcousumsys": user_name,
            "bcoestmsys": estacion,
        }
        normalize_null_values(insert_dict)
        inserts.append(insert_dict)

    return inserts


def prepare_agencias_inserts(data, sCodCia, clicodigo, user_name, estacion, client_citycode=None):
    """Prepare INSERT statements for agencias (cxctcliagencias)

    Args:
        data: Form data containing agencias array
        sCodCia: Company code
        clicodigo: Client code
        user_name: Username
        estacion: Workstation
        client_citycode: Client's city code (used as fallback for agencies without city)
    """
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    inserts = []
    agencias = data.get("agencias", [])
    if not isinstance(agencias, list):
        return inserts

    for item_idx, item in enumerate(agencias):
        if not item:
            continue

        agency_code = str(item.get("agencodigo") or item.get("codigo") or "").strip()
        if not agency_code:
            continue

        # CRITICAL FIX: ciucodigo cannot be NULL - use client's city code as fallback
        # This matches VB behavior where default agency uses client's city (dcbCiudad.BoundText)
        agency_ciudad = str(item.get("ciucodigo") or item.get("ciudad") or "").strip()
        if not agency_ciudad and client_citycode:
            agency_ciudad = client_citycode

        # Build insert dict
        insert_dict = {
            "ciacodigo": sCodCia,
            "clicodigo": clicodigo,
            "agencodigo": truncate_field_to_max_length("agencodigo", agency_code),
            "agendescri": truncate_field_to_max_length("agendescri", str(item.get("agendescri") or item.get("descripcion") or "").strip()),
            "agendirec": truncate_field_to_max_length("agendirec", str(item.get("agendirec") or item.get("direccion") or "").strip()),
            "agentelpref1": truncate_field_to_max_length("agentelpref1", str(item.get("agentelpref1") or item.get("telPref1") or "").strip()),
            "agentelef1": truncate_field_to_max_length("agentelef1", str(item.get("agentelef1") or item.get("telefono1") or "").strip()),
            "agentelext1": truncate_field_to_max_length("agentelext1", str(item.get("agentelext1") or item.get("ext1") or "").strip()),
            "agentelpref2": truncate_field_to_max_length("agentelpref2", str(item.get("agentelpref2") or item.get("telPref2") or "").strip()),
            "agentelef2": truncate_field_to_max_length("agentelef2", str(item.get("agentelef2") or item.get("telefono2") or "").strip()),
            "agentelext2": truncate_field_to_max_length("agentelext2", str(item.get("agentelext2") or item.get("ext2") or "").strip()),
            "agenemail": truncate_field_to_max_length("agenemail", str(item.get("agenemail") or item.get("email") or "").strip()),
            "regcodigo": truncate_field_to_max_length("regcodigo", str(item.get("regcodigo") or item.get("region") or "").strip()),
            "zoncodigo": truncate_field_to_max_length("zoncodigo", str(item.get("zoncodigo") or item.get("zona") or "").strip()),
            "procodigo": truncate_field_to_max_length("procodigo", str(item.get("procodigo") or item.get("provincia") or "").strip()),
            "ciucodigo": truncate_field_to_max_length("ciucodigo", agency_ciudad or ""),  # CRITICAL: fallback to client city
            "agecodrelext": truncate_field_to_max_length("agecodrelext", str(item.get("agecodrelext") or item.get("codigoExterno") or "").strip()),
            "agenfecisys": now_date,
            "agenhorisys": now_hour,
            "agenusuisys": user_name,
            "agenestisys": estacion,
        }

        # VALIDATION: Check NOT NULL fields before normalize
        validation_errors = []
        if not insert_dict.get("agendirec") or insert_dict["agendirec"] == "":
            validation_errors.append("Agencia #" + str(item_idx + 1) + ": La dirección es requerida")
        if not insert_dict.get("agentelef1") or insert_dict["agentelef1"] == "":
            validation_errors.append("Agencia #" + str(item_idx + 1) + ": El teléfono 1 es requerido")
        if not insert_dict.get("agentelef2") or insert_dict["agentelef2"] == "":
            validation_errors.append("Agencia #" + str(item_idx + 1) + ": El teléfono 2 es requerido")
        if not insert_dict.get("agenemail") or insert_dict["agenemail"] == "":
            validation_errors.append("Agencia #" + str(item_idx + 1) + ": El email es requerido")
        if not insert_dict.get("ciucodigo") or insert_dict["ciucodigo"] == "":
            validation_errors.append("Agencia #" + str(item_idx + 1) + ": La ciudad es requerida (especifique en la agencia o en el cliente)")

        if validation_errors:
            raise ValueError(" | ".join(validation_errors))

        normalize_null_values(insert_dict)
        inserts.append(insert_dict)

    return inserts


def prepare_contactos_inserts(data, sCodCia, clicodigo, user_name, estacion):
    """Prepare INSERT statements for contactos (cxctclicontactos)"""
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    inserts = []
    contactos = data.get("contactos", [])
    if not isinstance(contactos, list):
        return inserts

    for item_idx, item in enumerate(contactos):
        if not item:
            continue
        # Map frontend field names to backend field names
        condescri = (item.get("condescri") or item.get("contacto", "")).strip()
        if not condescri:
            continue

        # Build insert dict
        insert_dict = {
            "ciacodigo": sCodCia,
            "clicodigo": clicodigo,
            "agencodigo": truncate_field_to_max_length("agencodigo", str(item.get("agencodigo", "") or "").strip()),
            "condescri": truncate_field_to_max_length("condescri", condescri),
            "concargo": truncate_field_to_max_length("concargo", (item.get("concargo") or item.get("cargo", "")).strip()),
            "contelpref1": truncate_field_to_max_length("contelpref1", (item.get("contelpref1") or item.get("telPref1", "")).strip()),
            "contelef1": truncate_field_to_max_length("contelef1", (item.get("contelef1") or item.get("telefono1", "")).strip()),
            "contelext1": truncate_field_to_max_length("contelext1", (item.get("contelext1") or item.get("ext1", "")).strip()),
            "contelpref2": truncate_field_to_max_length("contelpref2", (item.get("contelpref2") or item.get("telPref2", "")).strip()),
            "contelef2": truncate_field_to_max_length("contelef2", (item.get("contelef2") or item.get("telefono2", "")).strip()),
            "contelext2": truncate_field_to_max_length("contelext2", (item.get("contelext2") or item.get("ext2", "")).strip()),
            "concelular": truncate_field_to_max_length("concelular", (item.get("concelular") or item.get("celular", "")).strip()),
            "conemail": truncate_field_to_max_length("conemail", (item.get("conemail") or item.get("email", "")).strip()),
            "areadescri": truncate_field_to_max_length("areadescri", (item.get("areadescri") or item.get("area", "")).strip()),
            "concomenta": truncate_field_to_max_length("concomenta", (item.get("concomenta") or item.get("comentario", "")).strip()),
            "concodrelext": truncate_field_to_max_length("concodrelext", (item.get("concodrelext") or item.get("externo", "")).strip()),
            # Normalizar valViaje: si es string numérico, convertir a float; si es vacío o inválido, usar 0
            "convalviaje": float(item.get("convalviaje") or item.get("valViaje") or 0) if (item.get("convalviaje") or item.get("valViaje")) and str(item.get("convalviaje") or item.get("valViaje", "")).strip() else 0.0,
            "confecisys": now_date,
            "conhorisys": now_hour,
            "conusuisys": user_name,
            "conestisys": estacion,
        }

        # VALIDATION: Check NOT NULL fields (match VB database schema)
        validation_errors = []
        if not insert_dict.get("contelef1") or insert_dict["contelef1"] == "":
            validation_errors.append("Contacto #" + str(item_idx + 1) + ": El teléfono 1 es requerido")
        if not insert_dict.get("contelef2") or insert_dict["contelef2"] == "":
            validation_errors.append("Contacto #" + str(item_idx + 1) + ": El teléfono 2 es requerido")
        if not insert_dict.get("concelular") or insert_dict["concelular"] == "":
            validation_errors.append("Contacto #" + str(item_idx + 1) + ": El celular es requerido")
        if not insert_dict.get("conemail") or insert_dict["conemail"] == "":
            validation_errors.append("Contacto #" + str(item_idx + 1) + ": El email es requerido")
        if not insert_dict.get("concomenta") or insert_dict["concomenta"] == "":
            validation_errors.append("Contacto #" + str(item_idx + 1) + ": El comentario es requerido")
        # NOTE: areadescri is OPTIONAL (FK to cxcbareas, can be NULL)
        # Only validate if user provides a value - DB will enforce FK constraint

        if validation_errors:
            raise ValueError(" | ".join(validation_errors))

        normalize_null_values(insert_dict)
        inserts.append(insert_dict)

    return inserts


def prepare_descuentos_linea_inserts(data, sCodCia, clicodigo, user_name, estacion):
    """Prepare INSERT statements for descuentos por línea (cxcbclidesc)"""
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    inserts = []
    descuentos = data.get("descuentosLineas", [])
    if not isinstance(descuentos, list):
        return inserts

    for item in descuentos:
        if not item:
            continue
        # Map frontend field names to backend field names
        lincodigo = (item.get("lincodigo") or item.get("linea", "")).strip()
        if not lincodigo:
            continue
        insert_dict = {
            "ciacodigo": sCodCia,
            "clicodigo": clicodigo,
            "lincodigo": truncate_field_to_max_length("lincodigo", lincodigo),
            "marcodigo": truncate_field_to_max_length("marcodigo", (item.get("marcodigo") or item.get("marca", "")).strip() or ""),
            "desporcentaje": float(item.get("desporcentaje") or item.get("porcentaje", 0)) if (item.get("desporcentaje") or item.get("porcentaje")) else 0,
            "deslistaprecio": int(item.get("deslistaprecio") or item.get("listaPrecios", 0)) if (item.get("deslistaprecio") or item.get("listaPrecios") is not None) else 0,
            "desfecisys": now_date,
            "deshorisys": now_hour,
            "desusuisys": user_name,
            "desestisys": estacion,
            "desfecmsys": now_date,
            "deshormsys": now_hour,
            "desusumsys": user_name,
            "desestmsys": estacion,
        }
        normalize_null_values(insert_dict)
        inserts.append(insert_dict)

    return inserts


def prepare_descuentos_articulo_inserts(data, sCodCia, clicodigo, user_name, estacion):
    """Prepare INSERT statements for descuentos por artículo (cxcbclidescart)"""
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    inserts = []
    articulos = data.get("descuentosArticulos", [])
    if not isinstance(articulos, list):
        return inserts

    for item in articulos:
        if not item:
            continue
        # Map frontend field names to backend field names
        artcodigo = (item.get("artcodigo") or item.get("articulo", "")).strip()
        if not artcodigo:
            continue
        insert_dict = {
            "ciacodigo": sCodCia,
            "clicodigo": clicodigo,
            "artcodigo": truncate_field_to_max_length("artcodigo", artcodigo),
            "invcodigo": truncate_field_to_max_length("invcodigo", (item.get("invcodigo", "")).strip() or ""),
            "desporcentaje": float(item.get("desporcentaje") or item.get("porcentaje", 0)) if (item.get("desporcentaje") or item.get("porcentaje")) else 0,
            "deslistaprecio": int(item.get("deslistaprecio") or item.get("listaPrecios", 0)) if (item.get("deslistaprecio") or item.get("listaPrecios") is not None) else 0,
            "desfecisys": now_date,
            "deshorisys": now_hour,
            "desusuisys": user_name,
            "desestisys": estacion,
            "desfecmsys": now_date,
            "deshormsys": now_hour,
            "desusumsys": user_name,
            "desestmsys": estacion,
        }
        normalize_null_values(insert_dict)
        inserts.append(insert_dict)

    return inserts


def prepare_historial_inserts(data, sCodCia, clicodigo, user_name, estacion):
    """Prepare INSERT statements for historial (cxctclihistorial)"""
    now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    inserts = []
    historial = data.get("historial", [])
    if not isinstance(historial, list):
        historial = []

    for index, item in enumerate(historial, start=1):
        if not item:
            continue
        observacion = str(item.get("observacion", "") or "").strip()
        if not observacion:
            continue

        # Parse fecha y hora si vienen como string - NUNCA devolver string vacío
        fecha_raw = str(item.get("fechaRaw") or "").strip()
        fecha_item = parse_date(fecha_raw) if fecha_raw else now_date

        hora_raw = str(item.get("horaRaw") or "").strip()
        hora_item = parse_date(hora_raw) if hora_raw else now_hour

        insert_dict = {
            "ciacodigo": sCodCia,
            "clicodigo": clicodigo,
            "obssecuen": index,
            "obsobserva": observacion,
            "obsusuisys": str(item.get("usuario") or user_name),
            "obsestisys": str(item.get("estacion") or estacion),
            "obsfecisys": fecha_item,
            "obshorisys": hora_item,
        }
        normalize_null_values(insert_dict)
        inserts.append(insert_dict)

    return inserts
