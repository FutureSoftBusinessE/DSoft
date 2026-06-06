from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime
import re

from app.Compania import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

# Tipos de campos para validación
INTEGER_FIELDS = {
    "ciaanioejer",
    "cianivelescc",
    "cianiveleslin",
    "cianivelespre",
    "cianivelescta",
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
    "ciarecsalmen",
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
    "ciadiasretencion",
    "ciadiasemitirretencion",
    "CiaNivelOrg",
    "cianumvend",
    "ciapresupuesto",
    "ciaanioejer",
}

DECIMAL_FIELDS = {
    "ciaporretiva",
    "ciaporretfuente",
    "ciabasepuntos",
}

BIT_FIELDS = {
    "ciapropina",
    "ciacontabilidad",
    "srimicroempresa",
    "sricartera",
    "sriguia",
    "sriagenteretencion",
    "sricorreoffice",
    "sricopiacorreo",
    "srimensajefactura",
    "srissltls",
}

DATETIME_FIELDS = {
    "ciafecminacc",
    "ciafecinipre",
    "ciafecresolucion",
    "versionfac",
    "versionpdf",
    "srioffini",
    "sriofffin",
}

# Mismos tamaños máximos que crearCompania.py (schema SQL SiacDesignsoft.dbo.siaccia)
FIELD_MAX_LENGTHS = {
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
}

# Mismos defaults que crearCompania.py (NOT NULL con DEFAULT en BD)
FIELD_DEFAULTS = {
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
}


# Funciones de validación por tipo de dato


def validate_integer(field, value):
    """Valida y normaliza un valor entero"""
    if value is None or value == "":
        return {"valid": True, "normalized": None}

    try:
        if isinstance(value, bool):
            return {
                "valid": False,
                "error": f"Debe ser un número entero, recibido: {value}",
            }

        int_val = int(value) if not isinstance(value, int) else value

        # SQL Server INT range: -2,147,483,648 to 2,147,483,647
        if int_val < -2147483648 or int_val > 2147483647:
            return {
                "valid": False,
                "error": f"Valor fuera de rango entero: {int_val}",
            }
        return {"valid": True, "normalized": int_val}
    except (ValueError, TypeError):
        return {
            "valid": False,
            "error": f"Debe ser un número entero, recibido: '{value}'",
        }


def validate_decimal(field, value):
    """Valida y normaliza un valor decimal"""
    if value is None or value == "":
        return {"valid": True, "normalized": None}

    try:
        decimal_val = float(value)
        if not isinstance(decimal_val, (int, float)) and not isinstance(value, str):
            return {
                "valid": False,
                "error": f"Debe ser un número decimal, recibido: '{value}'",
            }

        return {"valid": True, "normalized": decimal_val}
    except (ValueError, TypeError):
        return {
            "valid": False,
            "error": f"Debe ser un número decimal, recibido: '{value}'",
        }


def validate_bit(field, value):
    """Valida y normaliza un valor bit (booleano)"""
    if value is None or value == "":
        return {"valid": True, "normalized": 0}

    # Si es boolean
    if isinstance(value, bool):
        return {"valid": True, "normalized": -1 if value else 0}

    # Si es número
    if isinstance(value, (int, float)):
        return {"valid": True, "normalized": 0 if int(value) == 0 else -1}

    # Si es string
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

    return {
        "valid": False,
        "error": f"Debe ser sí/no (S/N), recibido: '{value}'",
    }


def validate_date(field, value):
    """Valida y normaliza una fecha ISO (YYYY-MM-DD)"""
    if value is None or value == "":
        return {"valid": True, "normalized": None}

    # Si es datetime/date
    if isinstance(value, datetime):
        return {
            "valid": True,
            "normalized": value.strftime("%Y-%m-%d"),
        }

    # Si es string
    if isinstance(value, str):
        trimmed = value.strip()
        if not trimmed:
            return {"valid": True, "normalized": None}

        # Validar formato ISO YYYY-MM-DD
        iso_pattern = r"^(\d{4})-(\d{2})-(\d{2})"
        iso_match = re.match(iso_pattern, trimmed)

        if iso_match:
            year, month, day = iso_match.groups()
            month_num = int(month)
            day_num = int(day)

            if month_num < 1 or month_num > 12:
                return {"valid": False, "error": f"Mes inválido: {month_num}"}
            if day_num < 1 or day_num > 31:
                return {"valid": False, "error": f"Día inválido: {day_num}"}

            return {"valid": True, "normalized": f"{year}-{month}-{day}"}

        # Intentar parsear como fecha
        try:
            parsed_date = datetime.fromisoformat(trimmed.replace(" ", "T"))
            return {
                "valid": True,
                "normalized": parsed_date.strftime("%Y-%m-%d"),
            }
        except (ValueError, TypeError):
            return {
                "valid": False,
                "error": f"Formato de fecha inválido: '{trimmed}' (usa YYYY-MM-DD)",
            }

    return {
        "valid": False,
        "error": "Tipo de dato inválido para fecha",
    }


def validate_string(field, value, max_lengths):
    """Valida y normaliza un string"""
    if value is None:
        return {"valid": True, "normalized": None}

    if value == "":
        return {"valid": True, "normalized": ""}

    str_val = str(value).strip()
    max_len = max_lengths.get(field)

    if max_len and len(str_val) > max_len:
        return {
            "valid": False,
            "error": f"Longitud máxima: {max_len} caracteres (actual: {len(str_val)})",
        }

    return {"valid": True, "normalized": str_val}


def validate_field_type(field, value, max_lengths):
    """Valida un campo según su tipo definido"""
    if value is None or value == "":
        # Los campos numéricos vacios se tratan especialmente
        if field in INTEGER_FIELDS or field in DECIMAL_FIELDS:
            return {"valid": True, "normalized": None}
        if field in BIT_FIELDS:
            return {"valid": True, "normalized": 0}
        return {"valid": True, "normalized": None}

    if field in INTEGER_FIELDS:
        return validate_integer(field, value)
    elif field in DECIMAL_FIELDS:
        return validate_decimal(field, value)
    elif field in BIT_FIELDS:
        return validate_bit(field, value)
    elif field in DATETIME_FIELDS:
        return validate_date(field, value)
    else:
        return validate_string(field, value, max_lengths)


# FUNCION DE VALIDACION PRINCIPAL


def validar_compania(connection, columns: list, required: list, key_columns: list, rows: list):

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
            raise ValidationError(f"Fila #{i+1} inválida: debe ser un objeto")

        fila["ok"] = True
        fila["feedback"] = ""

        # Campos required vacios
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

        # Aplicar defaults para campos NOT NULL con DEFAULT (igual que crearCompania)
        for campo, default_val in FIELD_DEFAULTS.items():
            v = fila.get(campo)
            if v is None or (isinstance(v, str) and v.strip() == ""):
                fila[campo] = default_val

        # Validar types de datos para cada campo
        errores_tipo = []
        for campo in columns:
            v = fila.get(campo)
            if v is None or v == "":
                continue

            validation = validate_field_type(campo, v, FIELD_MAX_LENGTHS)

            if not validation["valid"]:
                errores_tipo.append(f"'{campo}': {validation['error']}")
            else:
                # Actualizar con el valor normalizado
                fila[campo] = validation["normalized"]

        if errores_tipo:
            fila["ok"] = False
            fila["feedback"] = "Error de tipo de dato: " + "; ".join(errores_tipo)
            continue

        # Validar longitudes máximas de campos VARCHAR (después de normalizar)
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

        # Duplicados en el mismo archivo
        clave = []
        for k in key_columns:
            v = fila.get(k)

            if isinstance(v, str):
                v = v.strip()
                fila[k] = v  # preserva el original sin lower

            clave.append("" if v is None else str(v).strip().lower())

        clave = tuple(clave)

        if clave in vistos:
            fila["ok"] = False
            fila["feedback"] = "Registro duplicado en el archivo"
            continue

        vistos.add(clave)

    # Existentes en DB
    cols_sql = ", ".join(key_columns)

    # Para compañías, ciacodigo es la PK de cada fila — se consultan todas las compañías
    sql_get_all = text(f"SELECT {cols_sql} FROM siaccia")
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
                fila[k] = v  # preserva el original sin lower

            clave_fila.append("" if v is None else str(v).strip().lower())

        if tuple(clave_fila) in existentes:
            fila["ok"] = False
            fila["feedback"] = "Compañía ya existe"

    valid_rows = sum(1 for fila in rows if fila["ok"])
    invalid_rows = len(rows) - valid_rows

    return rows, {"valid_rows": valid_rows, "invalid_rows": invalid_rows}


@bp.route("/validarCompaniaIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def validarCompaniaIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json()

    # Son las columnas de la tabla
    columns = data.get("columns")

    # Son las columnas que no pueden estar vacías (obligatorias)
    required = data.get("required")

    # Son las columnas que forman la clave (para las validaciones)
    key_columns = data.get("key_columns")

    # Son las filas con los datos del csv
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # ciacodigo viene del CSV (es la PK de la compañía), no se inyecta desde JWT

    with engine.connect() as connection:
        rows, summary = validar_compania(connection, columns, required, key_columns, rows_csv)

    return {"rows": rows, "summary": summary}
