# flake8: noqa: E501
from flask import jsonify, request
from app.Compania import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from datetime import datetime
from error_handling import api_endpoint, ValidationError, APIError
import re
import base64
from services.encrip_desencrip import encriptar
from dotenv import load_dotenv
from decouple import config as config_env

# Cargar variables de entorno desde el archivo .env
load_dotenv()


def decode_base64_safe(base64_str):
    """Decodifica base64 de forma tolerante, agregando padding si es necesario."""
    if not base64_str:
        return None
    try:
        # Limpiar espacios en blanco
        base64_str = base64_str.strip()
        # Agregar padding si es necesario (base64 requiere múltiplos de 4)
        padding = 4 - (len(base64_str) % 4)
        if padding != 4:
            base64_str += "=" * padding
        return base64.b64decode(base64_str, validate=True)
    except Exception as e:
        raise ValidationError(f"Error decodificando imagen base64: {str(e)}")


# Campos que requieren conversión de tipos (solo a las columnas que realmente importan)
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


# Definición de tamaños máximos para campos VARCHAR (schema SQL SiacDesignsoft.dbo.siaccia)
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


def validate_field_length(field_name, field_value):
    """Valida la longitud máxima de un campo de texto"""
    if field_value is None or field_value == "":
        return
    max_length = FIELD_MAX_LENGTHS.get(field_name)
    if max_length is None:
        return
    value_str = str(field_value).strip()
    if len(value_str) > max_length:
        raise ValidationError(f"El campo '{field_name}' no puede exceder {max_length} caracteres. " f"Largo proporcionado: {len(value_str)}")


def generate_cliciagrupo(nombre, codigo):
    """Genera cliciagrupo: iniciales de cada palabra en mayusculas + código"""
    iniciales = "".join([palabra[0].upper() for palabra in nombre.split() if palabra])
    return f"{iniciales}{codigo}"


def generate_usuario_extra(nombre):
    """Genera usuario extra: solo letras, todo unido y en minúsculas"""
    # Eliminar todo lo que no sea letra o espacio
    solo_letras = re.sub(r"[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]", "", nombre)
    # Unir todo y convertir a minúsculas
    return solo_letras.replace(" ", "").lower()


@bp.route("/crearCompania", methods=["POST"])
@jwt_required()
@api_endpoint
def crearCompania():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    data = request.get_json()

    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)
    ipUser = request.headers.get("X-Forwarded-For", request.remote_addr)

    # ════════════════════════════════════════════════════════════════════════
    # Código de compañía - auto-generar si no se proporciona
    # ════════════════════════════════════════════════════════════════════════
    ciacodigo = data.get("ciacodigo") or ""
    if not ciacodigo or str(ciacodigo).strip() == "":
        # Auto-generar el siguiente código
        db.session = get_session(clicianonBD)
        engine = db.session.bind
        with engine.connect() as connection:
            with connection.begin():
                query = text("SELECT ciacodigo FROM siaccia")
                rows = connection.execute(query).mappings().fetchall()
                numeric_codes = [int(str(row.get("ciacodigo", "")).strip()) for row in rows if str(row.get("ciacodigo", "")).strip().isdigit()]
                next_code = (max(numeric_codes) + 1) if numeric_codes else 1
                if next_code > 99:
                    raise ValidationError("No se puede generar más códigos de compañía (máximo 99)")
                ciacodigo = str(next_code).zfill(2)

    ciadescri = data.get("ciadescri") or ""
    if not ciadescri or str(ciadescri).strip() == "":
        raise ValidationError("ciadescri es requerido")

    ciadirec = data.get("ciadirec") or ""
    if not ciadirec or str(ciadirec).strip() == "":
        raise ValidationError("ciadirec es requerido")

    ciasrirazon = data.get("ciasrirazon") or ""
    if not ciasrirazon or str(ciasrirazon).strip() == "":
        raise ValidationError("ciasrirazon es requerido")

    # ════════════════════════════════════════════════════════════════════════
    # NOT NULL con DEFAULT en BD (aplicar defaults si no se proporciona)
    # ════════════════════════════════════════════════════════════════════════
    ciapresupuesto = convert_field_type("ciapresupuesto", data.get("ciapresupuesto")) or 0
    cianivelescta = convert_field_type("cianivelescta", data.get("cianivelescta")) or 0
    aplitransing = convert_field_type("aplitransing", data.get("aplitransing")) or 0
    apliserie = convert_field_type("apliserie", data.get("apliserie")) or 0
    codclisec = convert_field_type("codclisec", data.get("codclisec")) or 0
    codprosec = convert_field_type("codprosec", data.get("codprosec")) or 0
    ciasecuencliente = convert_field_type("ciasecuencliente", data.get("ciasecuencliente")) or 0
    ciasecuenproveedor = convert_field_type("ciasecuenproveedor", data.get("ciasecuenproveedor")) or 0
    codartsec = convert_field_type("codartsec", data.get("codartsec")) or 0
    ciasecuenartventa = convert_field_type("ciasecuenartventa", data.get("ciasecuenartventa")) or 0
    ciasecuenarticulo = convert_field_type("ciasecuenarticulo", data.get("ciasecuenarticulo")) or 0
    ciaactualizaprecios = convert_field_type("ciaactualizaprecios", data.get("ciaactualizaprecios")) or 0
    ciasolautfactcxp = convert_field_type("ciasolautfactcxp", data.get("ciasolautfactcxp")) or 0
    ciaaproautfactcxp = convert_field_type("ciaaproautfactcxp", data.get("ciaaproautfactcxp")) or 0
    ciasolautanticxp = convert_field_type("ciasolautanticxp", data.get("ciasolautanticxp")) or 0
    ciaaproautanticxp = convert_field_type("ciaaproautanticxp", data.get("ciaaproautanticxp")) or 0
    ciasolautpagocxp = convert_field_type("ciasolautpagocxp", data.get("ciasolautpagocxp")) or 0
    ciaaproautpagocxp = convert_field_type("ciaaproautpagocxp", data.get("ciaaproautpagocxp")) or 0
    ciaaaocimport = convert_field_type("ciaaaocimport", data.get("ciaaaocimport")) or 0
    ciaaaocserv = convert_field_type("ciaaaocserv", data.get("ciaaaocserv")) or 0
    ciaaaocgasta = convert_field_type("ciaaaocgasta", data.get("ciaaaocgasta")) or 0
    ciaaaoclocal = convert_field_type("ciaaaoclocal", data.get("ciaaaoclocal")) or 0
    ciaaaocgastasoc = convert_field_type("ciaaaocgastasoc", data.get("ciaaaocgastasoc")) or 0
    ciafacitemrep = convert_field_type("ciafacitemrep", data.get("ciafacitemrep")) or 0
    ciasecuenemple = convert_field_type("ciasecuenemple", data.get("ciasecuenemple")) or 0
    ciasecuencargo = convert_field_type("ciasecuencargo", data.get("ciasecuencargo")) or 0
    ciavalprecost = convert_field_type("ciavalprecost", data.get("ciavalprecost")) or 0
    ciaporretiva = convert_field_type("ciaporretiva", data.get("ciaporretiva")) or 0
    ciaporretfuente = convert_field_type("ciaporretfuente", data.get("ciaporretfuente")) or 0
    ciaambienteelectronica = convert_field_type("ciaambienteelectronica", data.get("ciaambienteelectronica")) or 0
    srimicroempresa = data.get("srimicroempresa") or "N"
    sricartera = data.get("sricartera") or "N"
    sriguia = data.get("sriguia") or "N"
    sriagenteretencion = data.get("sriagenteretencion") or "N"
    sricorreoffice = data.get("sricorreoffice") or "N"
    sricopiacorreo = data.get("sricopiacorreo") or "N"
    srimensajefactura = data.get("srimensajefactura") or "N"
    srissltls = data.get("srissltls") or "N"
    ciaaaocliqcomloc = convert_field_type("ciaaaocliqcomloc", data.get("ciaaaocliqcomloc")) or 0
    ciaaaocliqcomimp = convert_field_type("ciaaaocliqcomimp", data.get("ciaaaocliqcomimp")) or 0
    ciaaaocliqcomser = convert_field_type("ciaaaocliqcomser", data.get("ciaaaocliqcomser")) or 0
    ciaaaocppe = convert_field_type("ciaaaocppe", data.get("ciaaaocppe")) or 0
    ciacobrapuntos = convert_field_type("ciacobrapuntos", data.get("ciacobrapuntos")) or 0
    ciacobracupos = convert_field_type("ciacobracupos", data.get("ciacobracupos")) or 0
    ciacobrafundacion = convert_field_type("ciacobrafundacion", data.get("ciacobrafundacion")) or 0
    ciancbeneficiario = convert_field_type("ciancbeneficiario", data.get("ciancbeneficiario")) or 0
    ciainmobiliaria = convert_field_type("ciainmobiliaria", data.get("ciainmobiliaria")) or 0
    ciancdevcxccia = convert_field_type("ciancdevcxccia", data.get("ciancdevcxccia")) or 0
    ciadiasretencion = convert_field_type("ciadiasretencion", data.get("ciadiasretencion")) or 0
    ciadiasemitirretencion = convert_field_type("ciadiasemitirretencion", data.get("ciadiasemitirretencion")) or 30
    ciapropina = convert_field_type("ciapropina", data.get("ciapropina")) or 0
    ciacontabilidad = convert_field_type("ciacontabilidad", data.get("ciacontabilidad")) or 1
    ciasolautclcxp = convert_field_type("ciasolautclcxp", data.get("ciasolautclcxp")) or 0
    ciaaproautclcxp = convert_field_type("ciaaproautclcxp", data.get("ciaaproautclcxp")) or 0
    ciaivaporproducto = convert_field_type("ciaivaporproducto", data.get("ciaivaporproducto")) or 0
    ciafacDeVariosLoc = convert_field_type("ciafacDeVariosLoc", data.get("ciafacDeVariosLoc")) or 0
    cialistprecdefweb = convert_field_type("cialistprecdefweb", data.get("cialistprecdefweb")) or 1
    ciavalidaemp = convert_field_type("ciavalidaemp", data.get("ciavalidaemp")) or 0
    ciabasepuntos = convert_field_type("ciabasepuntos", data.get("ciabasepuntos")) or 0

    # ════════════════════════════════════════════════════════════════════════
    # NULL sin DEFAULT (opcionales, del cliente)
    # ════════════════════════════════════════════════════════════════════════
    # Aplicar conversión de tipos a todos los campos
    ciaanioejer = convert_field_type("ciaanioejer", data.get("ciaanioejer"))
    ciaauxcredito = data.get("ciaauxcredito") or ""
    ciacontador = data.get("ciacontador") or ""
    ciaalias = data.get("ciaalias") or ""
    ciaruc = data.get("ciaruc") or ""
    ciafax = data.get("ciafax") or ""
    ciafecminacc = data.get("ciafecminacc") or ""
    ciaforcencos = data.get("ciaforcencos") or ""
    ciaforlin = data.get("ciaforlin") or ""
    ciagerente = data.get("ciagerente") or ""
    cianivelescc = convert_field_type("cianivelescc", data.get("cianivelescc"))
    cianiveleslin = convert_field_type("cianiveleslin", data.get("cianiveleslin"))
    ciapresidente = data.get("ciapresidente") or ""
    ciarecsalmen = convert_field_type("ciarecsalmen", data.get("ciarecsalmen"))
    ciaregcont = data.get("ciaregcont") or ""
    ciastatus = data.get("ciastatus") or ""
    ciatelefono1 = data.get("ciatelefono1") or ""
    ciatelefono2 = data.get("ciatelefono2") or ""
    ciavigilancia = data.get("ciavigilancia") or ""
    ciaciudad = data.get("ciaciudad") or ""
    ciapais = data.get("ciapais") or ""
    ciaescontesp = convert_field_type("ciaescontesp", data.get("ciaescontesp"))
    ciaemail = data.get("ciaemail") or ""
    ciaweb = data.get("ciaweb") or ""
    ciaanioinicon = convert_field_type("ciaanioinicon", data.get("ciaanioinicon"))
    ciaforpre = data.get("ciaforpre") or ""
    cianivelespre = convert_field_type("cianivelespre", data.get("cianivelespre"))
    ciadiasnc = convert_field_type("ciadiasnc", data.get("ciadiasnc"))
    ciacedgerente = data.get("ciacedgerente") or ""
    ciahelpart = data.get("ciahelpart") or ""
    ciacantfor = data.get("ciacantfor") or ""
    ciacostfor = data.get("ciacostfor") or ""
    ciavehele = convert_field_type("ciavehele", data.get("ciavehele"))
    ciafecinipre = data.get("ciafecinipre") or ""
    ciaforcta = data.get("ciaforcta") or ""
    ciasrifono = data.get("ciasrifono") or ""
    ciasrifax = data.get("ciasrifax") or ""
    ciasriemail = data.get("ciasriemail") or ""
    ciasriruccontador = data.get("ciasriruccontador") or ""
    ciatipoidengerente = data.get("ciatipoidengerente") or ""
    ciasridirmatriz = data.get("ciasridirmatriz") or ""
    ciasridocautventas = data.get("ciasridocautventas") or ""
    ciasrinotdebventas = data.get("ciasrinotdebventas") or ""
    ciasrinotcreventas = data.get("ciasrinotcreventas") or ""
    ciasriretfueventas = data.get("ciasriretfueventas") or ""
    ciacodlocmatriz = data.get("ciacodlocmatriz") or ""
    generacodian = convert_field_type("generacodian", data.get("generacodian"))
    coscodigo = data.get("coscodigo") or ""
    ciasecuentarjeta = data.get("ciasecuentarjeta") or ""
    cianumresolucion = data.get("cianumresolucion") or ""
    ciafecresolucion = data.get("ciafecresolucion") or ""
    CiaNivelOrg = convert_field_type("CiaNivelOrg", data.get("CiaNivelOrg"))
    ciafororg = data.get("ciafororg") or ""
    cianumvend = convert_field_type("cianumvend", data.get("cianumvend"))
    sriagenteretencionnumres = data.get("sriagenteretencionnumres") or ""
    srioffini = data.get("srioffini") or ""
    sriofffin = data.get("sriofffin") or ""
    ciaetiquetaadiret = data.get("ciaetiquetaadiret") or ""
    ciavaloradiret = data.get("ciavaloradiret") or ""

    # ════════════════════════════════════════════════════════════════════════
    # Campos de imagen (base64 desde el frontend -> bytes para SQL SERVER)
    # ════════════════════════════════════════════════════════════════════════
    cialogo_base64 = data.get("cialogo")
    cialogo = decode_base64_safe(cialogo_base64)
    ciaselloagua_base64 = data.get("ciaselloagua")
    ciaselloagua = decode_base64_safe(ciaselloagua_base64)

    ciaivaporproducto = convert_field_type("ciaivaporproducto", data.get("ciaivaporproducto"))
    ciafacelectronica = data.get("ciafacelectronica") or ""
    versionfac = data.get("versionfac") or ""
    ciapdfelectronica = data.get("ciapdfelectronica") or ""
    versionpdf = data.get("versionpdf") or ""
    ciactapagolote = data.get("ciactapagolote") or ""
    ciatipoocfaclote = data.get("ciatipoocfaclote") or ""
    ciaivaservicio = data.get("ciaivaservicio") or ""

    # ════════════════════════════════════════════════════════════════════════
    # Validar longitudes de todos los campos VARCHAR (independientemente constraints)
    # ════════════════════════════════════════════════════════════════════════
    for field_name, max_length in FIELD_MAX_LENGTHS.items():
        field_value = locals().get(field_name)
        validate_field_length(field_name, field_value)

    # ════════════════════════════════════════════════════════════════════════
    # NULL sin DEFAULT con asignación automática de auditoría (sistema)
    # ════════════════════════════════════════════════════════════════════════
    ciafecisys = fecha_actual
    ciafecmsys = fecha_actual
    ciahorisys = hora_sys
    ciahormsys = hora_sys
    ciausuisys = sUsuario
    ciausumsys = sUsuario

    # Obtener sesiones para AMBAS bases de datos
    session_company = get_session(clicianonBD)  # Compania actual donde se hizo login
    session_fsbs = get_session("SiacFSBS")  # SiacFSBS

    engine_company = session_company.bind
    engine_fsbs = session_fsbs.bind

    # Transacción en DOS bases de datos
    with engine_company.connect() as conn_company:
        with engine_fsbs.connect() as conn_fsbs:
            # Iniciar transacciones en AMBAS
            trans_company = conn_company.begin()
            trans_fsbs = conn_fsbs.begin()

            # ══════════════════════════════════════════════════════════════════
            # CREAR COMPAÑÍA y USUARIOS EN 2 BASES DE DATOS (ATÓMICO)
            # SiacDesignsoft: siaccia + siaccusr (1 usuario) + 14 tablas maestras
            #   - cxcbreg, fapzona, inbinv, intartjefe, cxcbformapag,
            #     inblin, inbmar, inbmed, inbpre, cxcbtipcli, cxcmcli,
            #     cgblocal, siac_local_sin_licencia,siactloc (2 usuarios)
            # SiacFSBS: fsbsmclicia + fsbsmcliusu (2 usuarios)
            # Si algo falla → ROLLBACK en ambas
            # ══════════════════════════════════════════════════════════════════

            try:
                # Verificar si ya existe la compañía
                check_query = text("SELECT ciacodigo FROM siaccia WHERE ciacodigo = :ciacodigo")
                result = conn_company.execute(check_query, {"ciacodigo": ciacodigo}).mappings().fetchone()
                if result:
                    raise ValidationError("La compañía ya existe")

                # Obtener el siguiente ID para fsbsmclicia
                next_id_query = text("SELECT ISNULL(MAX(cliciaidenti), 0) + 1 as next_id FROM fsbsmclicia")
                next_id_result = conn_fsbs.execute(next_id_query).mappings().fetchone()
                cliciaidenti = next_id_result["next_id"]

                # INSERT en fsbsmclicia
                insert_fsbsmclicia_query = text(
                    """
                    INSERT INTO fsbsmclicia (
                        cliciaidenti, cliciagrupo, cliciarutaBD, clicianonBD, cliciausuBD,
                        cliciaclaveBD, cliciaciacodigo, cliciacianombre, cliciaruc,
                        cliciafecisys, cliciausuisys, cliciaestisys
                    ) VALUES (
                        :cliciaidenti, :cliciagrupo, :cliciarutaBD, :clicianonBD, :cliciausuBD,
                        :cliciaclaveBD, :cliciaciacodigo, :cliciacianombre, :cliciaruc,
                        :cliciafecisys, :cliciausuisys, :cliciaestisys
                    )
                """
                )

                fsbs_cliciagrupo = generate_cliciagrupo(ciadescri, ciacodigo)

                conn_fsbs.execute(
                    insert_fsbsmclicia_query,
                    {
                        "cliciaidenti": cliciaidenti,
                        "cliciagrupo": fsbs_cliciagrupo,
                        "cliciarutaBD": f"{config_env('DB_SERVER')},{config_env('DB_PORT')}",  # Tomarlo desde la variable de entorne .venv
                        "clicianonBD": clicianonBD,
                        "cliciausuBD": config_env("DB_USER"),
                        "cliciaclaveBD": config_env("DB_PASS"),
                        "cliciaciacodigo": ciacodigo,
                        "cliciacianombre": ciadescri,
                        "cliciaruc": ciaruc,
                        "cliciafecisys": fecha_actual,
                        "cliciausuisys": sUsuario,
                        "cliciaestisys": ipUser,
                    },
                )

                # INSERT en fsbsmcliusu
                # Crear 2 usuarios: usuario que crea la nueva compania desde la compania actual y nuevo usuario extra
                insert_fsbsmcliusu_query = text(
                    """
                    INSERT INTO fsbsmcliusu (
                        cliciausu, cliciagrupo, cliciaidenti, cliciausustatus,
                        cliusufecisys, cliusufecmsys, cliusuusuisys, cliusuusumsys,
                        cliusuestisys, cliusuestmsys
                    ) VALUES (
                        :cliciausu, :cliciagrupo, :cliciaidenti, :cliciausustatus,
                        :cliusufecisys, :cliusufecmsys, :cliusuusuisys, :cliusuusumsys,
                        :cliusuestisys, :cliusuestmsys
                    )
                """
                )

                # Primer usuario: el que crea la compañía (viene de la compañía actual)
                conn_fsbs.execute(
                    insert_fsbsmcliusu_query,
                    {
                        "cliciausu": encriptar(sUsuario),
                        "cliciagrupo": fsbs_cliciagrupo,
                        "cliciaidenti": cliciaidenti,
                        "cliciausustatus": "D",
                        "cliusufecisys": fecha_actual,
                        "cliusufecmsys": fecha_actual,
                        "cliusuusuisys": sUsuario,
                        "cliusuusumsys": sUsuario,
                        "cliusuestisys": ipUser,
                        "cliusuestmsys": ipUser,
                    },
                )

                # Segundo usuario: nuevo usuario extra (iniciales sin código de compania)
                fsbs_new_cliciausu = generate_usuario_extra(ciaalias)
                conn_fsbs.execute(
                    insert_fsbsmcliusu_query,
                    {
                        "cliciausu": encriptar(fsbs_new_cliciausu),
                        "cliciagrupo": fsbs_cliciagrupo,  # MISMO grupo de la nueva compañía
                        "cliciaidenti": cliciaidenti,
                        "cliciausustatus": "D",
                        "cliusufecisys": fecha_actual,
                        "cliusufecmsys": fecha_actual,
                        "cliusuusuisys": sUsuario,
                        "cliusuusumsys": sUsuario,
                        "cliusuestisys": ipUser,
                        "cliusuestmsys": ipUser,
                    },
                )

                insert_params = {
                    "ciacodigo": ciacodigo,
                    "ciaanioejer": ciaanioejer,
                    "ciaauxcredito": ciaauxcredito,
                    "ciacontador": ciacontador,
                    "ciadescri": ciadescri,
                    "ciaalias": ciaalias,
                    "ciaruc": ciaruc,
                    "ciadirec": ciadirec,
                    "ciafax": ciafax,
                    "ciafecisys": ciafecisys,
                    "ciafecminacc": ciafecminacc,
                    "ciafecmsys": ciafecmsys,
                    "ciaforcencos": ciaforcencos,
                    "ciaforlin": ciaforlin,
                    "ciagerente": ciagerente,
                    "ciahorisys": ciahorisys,
                    "ciahormsys": ciahormsys,
                    "cianivelescc": cianivelescc,
                    "cianiveleslin": cianiveleslin,
                    "ciapresidente": ciapresidente,
                    "ciarecsalmen": ciarecsalmen,
                    "ciaregcont": ciaregcont,
                    "ciastatus": ciastatus,
                    "ciatelefono1": ciatelefono1,
                    "ciatelefono2": ciatelefono2,
                    "ciausuisys": ciausuisys,
                    "ciausumsys": ciausumsys,
                    "ciavigilancia": ciavigilancia,
                    "ciaciudad": ciaciudad,
                    "ciapais": ciapais,
                    "ciaescontesp": ciaescontesp,
                    "ciaemail": ciaemail,
                    "ciaweb": ciaweb,
                    "ciaanioinicon": ciaanioinicon,
                    "ciaforpre": ciaforpre,
                    "cianivelespre": cianivelespre,
                    "ciadiasnc": ciadiasnc,
                    "ciacedgerente": ciacedgerente,
                    "ciahelpart": ciahelpart,
                    "ciacantfor": ciacantfor,
                    "ciacostfor": ciacostfor,
                    "ciavehele": ciavehele,
                    "ciapresupuesto": ciapresupuesto,
                    "ciafecinipre": ciafecinipre,
                    "ciaforcta": ciaforcta,
                    "cianivelescta": cianivelescta,
                    "ciasrirazon": ciasrirazon,
                    "ciasrifono": ciasrifono,
                    "ciasrifax": ciasrifax,
                    "ciasriemail": ciasriemail,
                    "ciasriruccontador": ciasriruccontador,
                    "ciatipoidengerente": ciatipoidengerente,
                    "ciasridirmatriz": ciasridirmatriz,
                    "ciasridocautventas": ciasridocautventas,
                    "ciasrinotdebventas": ciasrinotdebventas,
                    "ciasrinotcreventas": ciasrinotcreventas,
                    "ciasriretfueventas": ciasriretfueventas,
                    "ciacodlocmatriz": ciacodlocmatriz,
                    "generacodian": generacodian,
                    "coscodigo": coscodigo,
                    "aplitransing": aplitransing,
                    "apliserie": apliserie,
                    "codclisec": codclisec,
                    "codprosec": codprosec,
                    "ciasecuencliente": ciasecuencliente,
                    "ciasecuenproveedor": ciasecuenproveedor,
                    "ciasecuentarjeta": ciasecuentarjeta,
                    "codartsec": codartsec,
                    "ciasecuenartventa": ciasecuenartventa,
                    "ciasecuenarticulo": ciasecuenarticulo,
                    "ciaactualizaprecios": ciaactualizaprecios,
                    "cianumresolucion": cianumresolucion,
                    "ciafecresolucion": ciafecresolucion,
                    "CiaNivelOrg": CiaNivelOrg,
                    "ciafororg": ciafororg,
                    "cianumvend": cianumvend,
                    "ciasolautfactcxp": ciasolautfactcxp,
                    "ciaaproautfactcxp": ciaaproautfactcxp,
                    "ciasolautanticxp": ciasolautanticxp,
                    "ciaaproautanticxp": ciaaproautanticxp,
                    "ciasolautpagocxp": ciasolautpagocxp,
                    "ciaaproautpagocxp": ciaaproautpagocxp,
                    "ciaaaocimport": ciaaaocimport,
                    "ciaaaocserv": ciaaaocserv,
                    "ciaaaocgasta": ciaaaocgasta,
                    "ciaaaoclocal": ciaaaoclocal,
                    "ciaaaocgastasoc": ciaaaocgastasoc,
                    "ciafacitemrep": ciafacitemrep,
                    "ciasecuenemple": ciasecuenemple,
                    "ciasecuencargo": ciasecuencargo,
                    "ciavalprecost": ciavalprecost,
                    "ciaporretiva": ciaporretiva,
                    "ciaporretfuente": ciaporretfuente,
                    "ciactapagolote": ciactapagolote,
                    "ciatipoocfaclote": ciatipoocfaclote,
                    "ciaivaservicio": ciaivaservicio,
                    "ciafacelectronica": ciafacelectronica,
                    "versionfac": versionfac,
                    "ciapdfelectronica": ciapdfelectronica,
                    "versionpdf": versionpdf,
                    "ciaambienteelectronica": ciaambienteelectronica,
                    "srimicroempresa": srimicroempresa,
                    "sricartera": sricartera,
                    "sriguia": sriguia,
                    "sriagenteretencion": sriagenteretencion,
                    "sriagenteretencionnumres": sriagenteretencionnumres,
                    "sricorreoffice": sricorreoffice,
                    "sricopiacorreo": sricopiacorreo,
                    "srimensajefactura": srimensajefactura,
                    "srissltls": srissltls,
                    "srioffini": srioffini,
                    "sriofffin": sriofffin,
                    "ciaaaocliqcomloc": ciaaaocliqcomloc,
                    "ciaaaocliqcomimp": ciaaaocliqcomimp,
                    "ciaaaocliqcomser": ciaaaocliqcomser,
                    "ciaaaocppe": ciaaaocppe,
                    "ciacobrapuntos": ciacobrapuntos,
                    "ciacobracupos": ciacobracupos,
                    "ciacobrafundacion": ciacobrafundacion,
                    "ciancbeneficiario": ciancbeneficiario,
                    "ciainmobiliaria": ciainmobiliaria,
                    "ciancdevcxccia": ciancdevcxccia,
                    "ciadiasretencion": ciadiasretencion,
                    "ciadiasemitirretencion": ciadiasemitirretencion,
                    "ciapropina": ciapropina,
                    "ciacontabilidad": ciacontabilidad,
                    "ciaetiquetaadiret": ciaetiquetaadiret,
                    "ciavaloradiret": ciavaloradiret,
                    "ciasolautclcxp": ciasolautclcxp,
                    "ciaaproautclcxp": ciaaproautclcxp,
                    "cialogo": cialogo,
                    "ciaselloagua": ciaselloagua,
                    "ciaivaporproducto": ciaivaporproducto,
                    "ciafacDeVariosLoc": ciafacDeVariosLoc,
                    "cialistprecdefweb": cialistprecdefweb,
                    "ciavalidaemp": ciavalidaemp,
                    "ciabasepuntos": ciabasepuntos,
                }

                insert_query = text(
                    """
                    INSERT INTO siaccia (
                        ciacodigo, ciaanioejer, ciaauxcredito, ciacontador, ciadescri, ciaalias,
                        ciaruc, ciadirec, ciafax, ciafecisys, ciafecminacc, ciafecmsys,
                        ciaforcencos, ciaforlin, ciagerente, ciahorisys, ciahormsys,
                        cianivelescc, cianiveleslin, ciapresidente, ciarecsalmen, ciaregcont,
                        ciastatus, ciatelefono1, ciatelefono2, ciausuisys, ciausumsys,
                        ciavigilancia, ciaciudad, ciapais, ciaescontesp, ciaemail, ciaweb,
                        ciaanioinicon, ciaforpre, cianivelespre, ciadiasnc, ciacedgerente,
                        ciahelpart, ciacantfor, ciacostfor, ciavehele, ciapresupuesto,
                        ciafecinipre, ciaforcta, cianivelescta, ciasrirazon, ciasrifono,
                        ciasrifax, ciasriemail, ciasriruccontador, ciatipoidengerente,
                        ciasridirmatriz, ciasridocautventas, ciasrinotdebventas,
                        ciasrinotcreventas, ciasriretfueventas, ciacodlocmatriz,
                        generacodian, coscodigo, aplitransing, apliserie, codclisec,
                        codprosec, ciasecuencliente, ciasecuenproveedor, ciasecuentarjeta,
                        codartsec, ciasecuenartventa, ciasecuenarticulo, ciaactualizaprecios,
                        cianumresolucion, ciafecresolucion, CiaNivelOrg, ciafororg, cianumvend,
                        ciasolautfactcxp, ciaaproautfactcxp, ciasolautanticxp, ciaaproautanticxp,
                        ciasolautpagocxp, ciaaproautpagocxp, ciaaaocimport, ciaaaocserv,
                        ciaaaocgasta, ciaaaoclocal, ciaaaocgastasoc, ciafacitemrep,
                        ciasecuenemple, ciasecuencargo, ciavalprecost, ciaporretiva,
                        ciaporretfuente, ciactapagolote, ciatipoocfaclote, ciaivaservicio,
                        ciafacelectronica, versionfac, ciapdfelectronica, versionpdf,
                        ciaambienteelectronica, srimicroempresa, sricartera, sriguia,
                        sriagenteretencion, sriagenteretencionnumres, sricorreoffice,
                        sricopiacorreo, srimensajefactura, srissltls, srioffini, sriofffin,
                        ciaaaocliqcomloc, ciaaaocliqcomimp, ciaaaocliqcomser, ciaaaocppe,
                        ciacobrapuntos, ciacobracupos, ciacobrafundacion, ciancbeneficiario,
                        ciainmobiliaria, ciancdevcxccia, ciadiasretencion, ciadiasemitirretencion,
                        ciapropina, ciacontabilidad, ciaetiquetaadiret, ciavaloradiret,
                        ciasolautclcxp, ciaaproautclcxp, cialogo, ciaselloagua, ciaivaporproducto,
                        ciafacDeVariosLoc, cialistprecdefweb, ciavalidaemp, ciabasepuntos
                    ) VALUES (
                        :ciacodigo, :ciaanioejer, :ciaauxcredito, :ciacontador, :ciadescri, :ciaalias,
                        :ciaruc, :ciadirec, :ciafax, :ciafecisys, :ciafecminacc, :ciafecmsys,
                        :ciaforcencos, :ciaforlin, :ciagerente, :ciahorisys, :ciahormsys,
                        :cianivelescc, :cianiveleslin, :ciapresidente, :ciarecsalmen, :ciaregcont,
                        :ciastatus, :ciatelefono1, :ciatelefono2, :ciausuisys, :ciausumsys,
                        :ciavigilancia, :ciaciudad, :ciapais, :ciaescontesp, :ciaemail, :ciaweb,
                        :ciaanioinicon, :ciaforpre, :cianivelespre, :ciadiasnc, :ciacedgerente,
                        :ciahelpart, :ciacantfor, :ciacostfor, :ciavehele, :ciapresupuesto,
                        :ciafecinipre, :ciaforcta, :cianivelescta, :ciasrirazon, :ciasrifono,
                        :ciasrifax, :ciasriemail, :ciasriruccontador, :ciatipoidengerente,
                        :ciasridirmatriz, :ciasridocautventas, :ciasrinotdebventas,
                        :ciasrinotcreventas, :ciasriretfueventas, :ciacodlocmatriz,
                        :generacodian, :coscodigo, :aplitransing, :apliserie, :codclisec,
                        :codprosec, :ciasecuencliente, :ciasecuenproveedor, :ciasecuentarjeta,
                        :codartsec, :ciasecuenartventa, :ciasecuenarticulo, :ciaactualizaprecios,
                        :cianumresolucion, :ciafecresolucion, :CiaNivelOrg, :ciafororg, :cianumvend,
                        :ciasolautfactcxp, :ciaaproautfactcxp, :ciasolautanticxp, :ciaaproautanticxp,
                        :ciasolautpagocxp, :ciaaproautpagocxp, :ciaaaocimport, :ciaaaocserv,
                        :ciaaaocgasta, :ciaaaoclocal, :ciaaaocgastasoc, :ciafacitemrep,
                        :ciasecuenemple, :ciasecuencargo, :ciavalprecost, :ciaporretiva,
                        :ciaporretfuente, :ciactapagolote, :ciatipoocfaclote, :ciaivaservicio,
                        :ciafacelectronica, :versionfac, :ciapdfelectronica, :versionpdf,
                        :ciaambienteelectronica, :srimicroempresa, :sricartera, :sriguia,
                        :sriagenteretencion, :sriagenteretencionnumres, :sricorreoffice,
                        :sricopiacorreo, :srimensajefactura, :srissltls, :srioffini, :sriofffin,
                        :ciaaaocliqcomloc, :ciaaaocliqcomimp, :ciaaaocliqcomser, :ciaaaocppe,
                        :ciacobrapuntos, :ciacobracupos, :ciacobrafundacion, :ciancbeneficiario,
                        :ciainmobiliaria, :ciancdevcxccia, :ciadiasretencion, :ciadiasemitirretencion,
                        :ciapropina, :ciacontabilidad, :ciaetiquetaadiret, :ciavaloradiret,
                        :ciasolautclcxp, :ciaaproautclcxp, :cialogo, :ciaselloagua, :ciaivaporproducto,
                        :ciafacDeVariosLoc, :cialistprecdefweb, :ciavalidaemp, :ciabasepuntos
                    )
                    """
                )
                conn_company.execute(insert_query, insert_params)

                insert_siaccusr_query = text(
                    """
                    INSERT INTO siaccusr (
                        usrcodigo, usrnombre, usrclave, usrfeccad, usrstatus,
                        usrfecisys, usrhorisys, usrusuisys, usrfecmsys, usrhormsys, usrusumsys,
                        usrflagoficre, usrhelpart, usrhelpcli, usrcodper, usrflagperfil, usrhelppro,
                        usremail, usrestisys, usrestmsys, usrdiascaduclave, usrfecactuclave,
                        usrflagnuevmodi, usrcodigoreporta
                    ) VALUES (
                        :usrcodigo, :usrnombre, :usrclave, :usrfeccad, :usrstatus,
                        :usrfecisys, :usrhorisys, :usrusuisys, :usrfecmsys, :usrhormsys, :usrusumsys,
                        :usrflagoficre, :usrhelpart, :usrhelpcli, :usrcodper, :usrflagperfil, :usrhelppro,
                        :usremail, :usrestisys, :usrestmsys, :usrdiascaduclave, :usrfecactuclave,
                        :usrflagnuevmodi, :usrcodigoreporta
                    )
                """
                )

                # Primer usuario: el que crea la compañía (viene de la compañía actual)
                # La clave al ser usuarios nuevos seran el mismo que el usrcodigo
                # conn_company.execute(insert_siaccusr_query, {
                #     "usrcodigo": encriptar(sUsuario),
                #     "usrnombre": encriptar(sUsuario),
                #     "usrclave": encriptar(sUsuario),
                #     "usrfeccad": fecha_actual,
                #     "usrstatus": encriptar("A"),
                #     "usrfecisys": fecha_actual,
                #     "usrhorisys": hora_sys,
                #     "usrusuisys": sUsuario,
                #     "usrfecmsys": fecha_actual,
                #     "usrhormsys": hora_sys,
                #     "usrusumsys": sUsuario,
                #     "usrflagoficre": 0,
                #     "usrhelpart": "B",
                #     "usrhelpcli": "B",
                #     "usrcodper": "",
                #     "usrflagperfil": 0,
                #     "usrhelppro": "B",
                #     "usremail": "",
                #     "usrestisys": ipUser,
                #     "usrestmsys": ipUser,
                #     "usrdiascaduclave": 0,
                #     "usrfecactuclave": fecha_actual,
                #     "usrflagnuevmodi": 1,
                #     "usrcodigoreporta": ""
                # })

                # Segundo usuario: nuevo usuario extra (iniciales sin código de compania)
                conn_company.execute(
                    insert_siaccusr_query,
                    {
                        "usrcodigo": encriptar(fsbs_new_cliciausu),
                        "usrnombre": encriptar(fsbs_new_cliciausu),
                        "usrclave": encriptar(fsbs_new_cliciausu),
                        "usrfeccad": fecha_actual,
                        "usrstatus": encriptar("A"),
                        "usrfecisys": fecha_actual,
                        "usrhorisys": hora_sys,
                        "usrusuisys": sUsuario,
                        "usrfecmsys": fecha_actual,
                        "usrhormsys": hora_sys,
                        "usrusumsys": sUsuario,
                        "usrflagoficre": 0,
                        "usrhelpart": "B",
                        "usrhelpcli": "B",
                        "usrcodper": "",
                        "usrflagperfil": 0,
                        "usrhelppro": "B",
                        "usremail": ciaemail or "",
                        "usrestisys": ipUser,
                        "usrestmsys": ipUser,
                        "usrdiascaduclave": 0,
                        "usrfecactuclave": fecha_actual,
                        "usrflagnuevmodi": 1,
                        "usrcodigoreporta": "",
                    },
                )

                # ============================================================
                # INSERCIONES EN TABLAS MAESTRAS PARA EL NUEVO USUARIO
                # ============================================================

                # 1. INSERT en cxcbreg
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM cxcbreg WHERE ciacodigo = :ciacodigo AND regcodigo = :regcodigo)
                        INSERT INTO cxcbreg (ciacodigo, regcodigo, regdescri, regstatus, regfecisys, reghorisys, regusuisys, regfecmsys, reghormsys, regusumsys)
                        VALUES (:ciacodigo, :regcodigo, :regdescri, :regstatus, :regfecisys, :reghorisys, :regusuisys, :regfecmsys, :reghormsys, :regusumsys)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "regcodigo": "000",
                        "regdescri": "POR ACTUALIZAR",
                        "regstatus": "A",
                        "regfecisys": fecha_actual,
                        "reghorisys": hora_sys,
                        "regusuisys": sUsuario,
                        "regfecmsys": fecha_actual,
                        "reghormsys": hora_sys,
                        "regusumsys": sUsuario,
                    },
                )

                # 2. INSERT en fapzona
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM fapzona WHERE ciacodigo = :ciacodigo AND zoncodigo = :zoncodigo)
                        INSERT INTO fapzona (ciacodigo, zoncodigo, zondescri, zonstatus, zonfecisys, zonhorisys, zonusuisys, zonestisys, zonfecmsys, zonhormsys, zonusumsys, zonestmsys)
                        VALUES (:ciacodigo, :zoncodigo, :zondescri, :zonstatus, :zonfecisys, :zonhorisys, :zonusuisys, :zonestisys, :zonfecmsys, :zonhormsys, :zonusumsys, :zonestmsys)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "zoncodigo": "000",
                        "zondescri": "POR ACTUALIZAR",
                        "zonstatus": "A",
                        "zonfecisys": fecha_actual,
                        "zonhorisys": hora_sys,
                        "zonusuisys": sUsuario,
                        "zonestisys": ipUser,
                        "zonfecmsys": fecha_actual,
                        "zonhormsys": hora_sys,
                        "zonusumsys": sUsuario,
                        "zonestmsys": ipUser,
                    },
                )

                # 3. INSERT en inbinv
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM inbinv WHERE ciacodigo = :ciacodigo AND invcodigo = :invcodigo)
                        INSERT INTO inbinv (ciacodigo, invcodigo, invdescri, invstatus, invfecisys, invhorisys, invusuisys, invfecmsys, invhormsys, invusumsys)
                        VALUES (:ciacodigo, :invcodigo, :invdescri, :invstatus, :invfecisys, :invhorisys, :invusuisys, :invfecmsys, :invhormsys, :invusumsys)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "invcodigo": "01",
                        "invdescri": "GENERAL",
                        "invstatus": "A",
                        "invfecisys": fecha_actual,
                        "invhorisys": hora_sys,
                        "invusuisys": sUsuario,
                        "invfecmsys": fecha_actual,
                        "invhormsys": hora_sys,
                        "invusumsys": sUsuario,
                    },
                )

                # 4. INSERT en intartjefe
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM intartjefe WHERE ciacodigo = :ciacodigo AND jefecodigo = :jefecodigo)
                        INSERT INTO intartjefe (ciacodigo, jefecodigo, jefedescri, jefestatus, jefefecisys, jefehorisys, jefeusuisys, jefeestisys, jefefecmsys, jefehormsys, jefeusumsys, jefeestmsys, jefecomisiona)
                        VALUES (:ciacodigo, :jefecodigo, :jefedescri, :jefestatus, :jefefecisys, :jefehorisys, :jefeusuisys, :jefeestisys, :jefefecmsys, :jefehormsys, :jefeusumsys, :jefeestmsys, :jefecomisiona)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "jefecodigo": "0000",
                        "jefedescri": "SIN JEFE",
                        "jefestatus": "A",
                        "jefefecisys": fecha_actual,
                        "jefehorisys": hora_sys,
                        "jefeusuisys": sUsuario,
                        "jefeestisys": ipUser,
                        "jefefecmsys": fecha_actual,
                        "jefehormsys": hora_sys,
                        "jefeusumsys": sUsuario,
                        "jefeestmsys": ipUser,
                        "jefecomisiona": 0,
                    },
                )

                # 5. INSERT en cxcbformapag
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM cxcbformapag WHERE ciacodigo = :ciacodigo AND factippag = :factippag)
                        INSERT INTO cxcbformapag (ciacodigo, factippag, fordescri, fordias, fortipo, forcuotas, forstatus, forfecisys, forhorisys, forusuisys, forfecmsys, forhormsys, forusumsys, foranticipo, forintmen, fordocgen, foraplianti, foraplirango, formondesde, formonhasta, forapligrac, fordiasgrac, forcuoinigr, forguiarem, forcarven, forprenda, forcompnego, forentrecep, foruso, forpromocion, fordescuento, forfecini, forhorini, forfecfin, forhorfin, forlistapv, foraprocredito, foraprologistica, foraprocliente)
                        VALUES (:ciacodigo, :factippag, :fordescri, :fordias, :fortipo, :forcuotas, :forstatus, :forfecisys, :forhorisys, :forusuisys, :forfecmsys, :forhormsys, :forusumsys, :foranticipo, :forintmen, :fordocgen, :foraplianti, :foraplirango, :formondesde, :formonhasta, :forapligrac, :fordiasgrac, :forcuoinigr, :forguiarem, :forcarven, :forprenda, :forcompnego, :forentrecep, :foruso, :forpromocion, :fordescuento, :forfecini, :forhorini, :forfecfin, :forhorfin, :forlistapv, :foraprocredito, :foraprologistica, :foraprocliente)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "factippag": "EFE",
                        "fordescri": "AL CONTADO",
                        "fordias": 0,
                        "fortipo": "CC",
                        "forcuotas": 1,
                        "forstatus": "A",
                        "forfecisys": fecha_actual,
                        "forhorisys": hora_sys,
                        "forusuisys": sUsuario,
                        "forfecmsys": fecha_actual,
                        "forhormsys": hora_sys,
                        "forusumsys": sUsuario,
                        "foranticipo": 0,
                        "forintmen": 0,
                        "fordocgen": "N",
                        "foraplianti": 0,
                        "foraplirango": 0,
                        "formondesde": 0,
                        "formonhasta": 0,
                        "forapligrac": 0,
                        "fordiasgrac": 0,
                        "forcuoinigr": 0,
                        "forguiarem": 0,
                        "forcarven": 0,
                        "forprenda": 0,
                        "forcompnego": 0,
                        "forentrecep": 0,
                        "foruso": "F",
                        "forpromocion": 0,
                        "fordescuento": 0,
                        "forfecini": fecha_actual,
                        "forhorini": hora_sys,
                        "forfecfin": fecha_actual,
                        "forhorfin": hora_sys,
                        "forlistapv": 0,
                        "foraprocredito": 0,
                        "foraprologistica": 0,
                        "foraprocliente": 0,
                    },
                )

                # 6. INSERT en inblin
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM inblin WHERE ciacodigo = :ciacodigo AND lincodigo = :lincodigo)
                        INSERT INTO inblin (ciacodigo, lincodigo, lindescri, linlindes, coscodigo, linnivel, lintipo, linstatus, linfecisys, linhorisys, linusuisys, linfecmsys, linhormsys, linusumsys, numsecini, numseccont, lincodigo1)
                        VALUES (:ciacodigo, :lincodigo, :lindescri, :linlindes, :coscodigo, :linnivel, :lintipo, :linstatus, :linfecisys, :linhorisys, :linusuisys, :linfecmsys, :linhormsys, :linusumsys, :numsecini, :numseccont, :lincodigo1)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "lincodigo": "000000",
                        "lindescri": "ESTANDAR",
                        "linlindes": None,
                        "coscodigo": None,
                        "linnivel": 1,
                        "lintipo": "T",
                        "linstatus": "A",
                        "linfecisys": fecha_actual,
                        "linhorisys": hora_sys,
                        "linusuisys": sUsuario,
                        "linfecmsys": fecha_actual,
                        "linhormsys": hora_sys,
                        "linusumsys": sUsuario,
                        "numsecini": None,
                        "numseccont": None,
                        "lincodigo1": "000000",
                    },
                )

                # 7. INSERT en inbmar
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM inbmar WHERE ciacodigo = :ciacodigo AND marcodigo = :marcodigo)
                        INSERT INTO inbmar (ciacodigo, marcodigo, mardescri, marstatus, marfecisys, marhorisys, marusuisys, marfecmsys, marhormsys, marusumsys)
                        VALUES (:ciacodigo, :marcodigo, :mardescri, :marstatus, :marfecisys, :marhorisys, :marusuisys, :marfecmsys, :marhormsys, :marusumsys)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "marcodigo": "S/M",
                        "mardescri": "S/M",
                        "marstatus": "A",
                        "marfecisys": fecha_actual,
                        "marhorisys": hora_sys,
                        "marusuisys": sUsuario,
                        "marfecmsys": fecha_actual,
                        "marhormsys": hora_sys,
                        "marusumsys": sUsuario,
                    },
                )

                # 8. INSERT en inbmed
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM inbmed WHERE ciacodigo = :ciacodigo AND medcodigo = :medcodigo)
                        INSERT INTO inbmed (ciacodigo, medcodigo, meddescri, medstatus, medfecisys, medhorisys, medusuisys, medfecmsys, medhormsys, medusumsys)
                        VALUES (:ciacodigo, :medcodigo, :meddescri, :medstatus, :medfecisys, :medhorisys, :medusuisys, :medfecmsys, :medhormsys, :medusumsys)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "medcodigo": "SM",
                        "meddescri": "S/M",
                        "medstatus": "A",
                        "medfecisys": fecha_actual,
                        "medhorisys": hora_sys,
                        "medusuisys": sUsuario,
                        "medfecmsys": fecha_actual,
                        "medhormsys": hora_sys,
                        "medusumsys": sUsuario,
                    },
                )

                # 9. INSERT en inbpre
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM inbpre WHERE ciacodigo = :ciacodigo AND precodigo = :precodigo)
                        INSERT INTO inbpre (ciacodigo, precodigo, predescri, prestatus, prefecisys, prehorisys, preusuisys, prefecmsys, prehormsys, preusumsys)
                        VALUES (:ciacodigo, :precodigo, :predescri, :prestatus, :prefecisys, :prehorisys, :preusuisys, :prefecmsys, :prehormsys, :preusumsys)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "precodigo": "SP",
                        "predescri": "SP",
                        "prestatus": "A",
                        "prefecisys": fecha_actual,
                        "prehorisys": hora_sys,
                        "preusuisys": sUsuario,
                        "prefecmsys": fecha_actual,
                        "prehormsys": hora_sys,
                        "preusumsys": sUsuario,
                    },
                )

                # 9.5. INSERT en cxcbtipcli (requerido por FK de cxcmcli)
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM cxcbtipcli WHERE ciacodigo = :ciacodigo AND tipcodigo = :tipcodigo)
                        INSERT INTO cxcbtipcli (ciacodigo, tipcodigo, tipdescri, tipcobdir, tipfecisys, tiphorisys, tipusuisys, tipfecmsys, tiphormsys, tipusumsys, tipstatus, tipdefacr)
                        VALUES (:ciacodigo, :tipcodigo, :tipdescri, :tipcobdir, :tipfecisys, :tiphorisys, :tipusuisys, :tipfecmsys, :tiphormsys, :tipusumsys, :tipstatus, :tipdefacr)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "tipcodigo": "FIN",
                        "tipdescri": "CONSUMIDOR FINAL",
                        "tipcobdir": 0,
                        "tipfecisys": fecha_actual,
                        "tiphorisys": hora_sys,
                        "tipusuisys": sUsuario,
                        "tipfecmsys": fecha_actual,
                        "tiphormsys": hora_sys,
                        "tipusumsys": sUsuario,
                        "tipstatus": "A",
                        "tipdefacr": 0,
                    },
                )

                # 10. INSERT en cxcmcli
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM cxcmcli WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo)
                        INSERT INTO cxcmcli (ciacodigo, clicodigo, clinombre, cliaparta, cliruc, clidirec, clirepres, clitelef1, clitelef2, clifax, clidiascrs, climontocrs, clisalaplis, clidiascrd, climontocrd, clisalaplid, cliprefac, clistatus, clifecisys, clihorisys, cliusuisys, clifecmsys, clihormsys, cliusumsys, zoncodigo, regcodigo, cliapliiva, procodigo, cliestciv, cliprofesion, tipcodigo, clibloqueo, cliobserva, clifecnac, cliemail, calificacion, website, cliidencon, clidirec2, ciucodigo, usrcodigo, cliruccon, clinombrecon, clidireccon, cliprofesioncon, cliivaped, clirucmatriz, clinommatriz, cliintersec, clinumestable, tarenviosta, clirucrepres, cliidentifica, fecenvioxml, cliidenrep, clicuotaven, activicodigo, sectorcodigo, clidiapago, clihorapagodesde, clihorapagohasta, clidiasrecibefac1, clidiaentregafac, cliestisys, cliestmsys, cliconespecial, clitelpref1, clitelpref2, clitelext1, clitelext2, calfcodigo, clisexo, clipersona, cliorigening, clidemanda, clicastigada, parrocodigo, cliparterel, clitipodomicilio, clitiempodomicilio, cliubicacionrapido, clireferencia1, cliparentesco1, clireftelefono1, clireferencia2, cliparentesco2, clireftelefono2, paicodigonac, clilugarlabora, cliactivos, clipasivos, cliingresos, cliegresos, clipatrimonioneto, capcodigo, clifonocon, cliemailcon, activicodigocon, cliingresoscon, cliesfuncionario, cliinstitfuncionario, clienpolitica, clipartidopolitico, clifondosorigen, clifondosdestino, clifonorepres, clidirecrepres, cliemailrepres, apocodigo, clifonolabora, clicontactonombre, clicontactoemail, clipaicodigocon, clicertvotacion, clicertvotacioncon)
                        VALUES (:ciacodigo, :clicodigo, :clinombre, :cliaparta, :cliruc, :clidirec, :clirepres, :clitelef1, :clitelef2, :clifax, :clidiascrs, :climontocrs, :clisalaplis, :clidiascrd, :climontocrd, :clisalaplid, :cliprefac, :clistatus, :clifecisys, :clihorisys, :cliusuisys, :clifecmsys, :clihormsys, :cliusumsys, :zoncodigo, :regcodigo, :cliapliiva, :procodigo, :cliestciv, :cliprofesion, :tipcodigo, :clibloqueo, :cliobserva, :clifecnac, :cliemail, :calificacion, :website, :cliidencon, :clidirec2, :ciucodigo, :usrcodigo, :cliruccon, :clinombrecon, :clidireccon, :cliprofesioncon, :cliivaped, :clirucmatriz, :clinommatriz, :cliintersec, :clinumestable, :tarenviosta, :clirucrepres, :cliidentifica, :fecenvioxml, :cliidenrep, :clicuotaven, :activicodigo, :sectorcodigo, :clidiapago, :clihorapagodesde, :clihorapagohasta, :clidiasrecibefac1, :clidiaentregafac, :cliestisys, :cliestmsys, :cliconespecial, :clitelpref1, :clitelpref2, :clitelext1, :clitelext2, :calfcodigo, :clisexo, :clipersona, :cliorigening, :clidemanda, :clicastigada, :parrocodigo, :cliparterel, :clitipodomicilio, :clitiempodomicilio, :cliubicacionrapido, :clireferencia1, :cliparentesco1, :clireftelefono1, :clireferencia2, :cliparentesco2, :clireftelefono2, :paicodigonac, :clilugarlabora, :cliactivos, :clipasivos, :cliingresos, :cliegresos, :clipatrimonioneto, :capcodigo, :clifonocon, :cliemailcon, :activicodigocon, :cliingresoscon, :cliesfuncionario, :cliinstitfuncionario, :clienpolitica, :clipartidopolitico, :clifondosorigen, :clifondosdestino, :clifonorepres, :clidirecrepres, :cliemailrepres, :apocodigo, :clifonolabora, :clicontactonombre, :clicontactoemail, :clipaicodigocon, :clicertvotacion, :clicertvotacioncon)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "clicodigo": "000001",
                        "clinombre": "CONSUMIDOR FINAL",
                        "cliaparta": None,
                        "cliruc": "9999999999999",
                        "clidirec": "GUAYAQUIL",
                        "clirepres": None,
                        "clitelef1": "42222222",
                        "clitelef2": None,
                        "clifax": None,
                        "clidiascrs": 0,
                        "climontocrs": 0,
                        "clisalaplis": 0,
                        "clidiascrd": 0,
                        "climontocrd": 0,
                        "clisalaplid": 0,
                        "cliprefac": 1,
                        "clistatus": "A",
                        "clifecisys": fecha_actual,
                        "clihorisys": hora_sys,
                        "cliusuisys": sUsuario,
                        "clifecmsys": fecha_actual,
                        "clihormsys": hora_sys,
                        "cliusumsys": sUsuario,
                        "zoncodigo": "000",
                        "regcodigo": "000",
                        "cliapliiva": -1,
                        "procodigo": None,
                        "cliestciv": "SOLTERO",
                        "cliprofesion": None,
                        "tipcodigo": "FIN",
                        "clibloqueo": 0,
                        "cliobserva": None,
                        "clifecnac": None,
                        "cliemail": "otros@gmail.com",
                        "calificacion": "0",
                        "website": None,
                        "cliidencon": "O",
                        "clidirec2": None,
                        "ciucodigo": None,
                        "usrcodigo": None,
                        "cliruccon": None,
                        "clinombrecon": None,
                        "clidireccon": None,
                        "cliprofesioncon": None,
                        "cliivaped": 0,
                        "clirucmatriz": "9999999999999",
                        "clinommatriz": "CLIENTE FINAL",
                        "cliintersec": None,
                        "clinumestable": None,
                        "tarenviosta": "D",
                        "clirucrepres": None,
                        "cliidentifica": "O",
                        "fecenvioxml": None,
                        "cliidenrep": "O",
                        "clicuotaven": 0,
                        "activicodigo": None,
                        "sectorcodigo": None,
                        "clidiapago": 2,
                        "clihorapagodesde": fecha_actual,
                        "clihorapagohasta": fecha_actual,
                        "clidiasrecibefac1": 0,
                        "clidiaentregafac": 0,
                        "cliestisys": ipUser,
                        "cliestmsys": ipUser,
                        "cliconespecial": 0,
                        "clitelpref1": None,
                        "clitelpref2": None,
                        "clitelext1": None,
                        "clitelext2": None,
                        "calfcodigo": None,
                        "clisexo": "M",
                        "clipersona": "N",
                        "cliorigening": "I",
                        "clidemanda": 0,
                        "clicastigada": 0,
                        "parrocodigo": None,
                        "cliparterel": 0,
                        "clitipodomicilio": None,
                        "clitiempodomicilio": None,
                        "cliubicacionrapido": None,
                        "clireferencia1": None,
                        "cliparentesco1": None,
                        "clireftelefono1": None,
                        "clireferencia2": None,
                        "cliparentesco2": None,
                        "clireftelefono2": None,
                        "paicodigonac": None,
                        "clilugarlabora": None,
                        "cliactivos": None,
                        "clipasivos": None,
                        "cliingresos": None,
                        "cliegresos": None,
                        "clipatrimonioneto": None,
                        "capcodigo": None,
                        "clifonocon": None,
                        "cliemailcon": None,
                        "activicodigocon": None,
                        "cliingresoscon": None,
                        "cliesfuncionario": None,
                        "cliinstitfuncionario": None,
                        "clienpolitica": None,
                        "clipartidopolitico": None,
                        "clifondosorigen": None,
                        "clifondosdestino": None,
                        "clifonorepres": None,
                        "clidirecrepres": None,
                        "cliemailrepres": None,
                        "apocodigo": None,
                        "clifonolabora": None,
                        "clicontactonombre": None,
                        "clicontactoemail": None,
                        "clipaicodigocon": None,
                        "clicertvotacion": None,
                        "clicertvotacioncon": None,
                    },
                )

                # 10.5. INSERT en siac_local_sin_licencia (requerido por FK de cgblocal)
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM siac_local_sin_licencia WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo)
                        INSERT INTO siac_local_sin_licencia (ciacodigo, loccodigo, locmensaje, loclicencia)
                        VALUES (:ciacodigo, :loccodigo, :locmensaje, :loclicencia)
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "loccodigo": "01",
                        "locmensaje": "MATRIZ",
                        "loclicencia": "S",
                    },
                )

                # 11. INSERT en cgblocal (localidad MATRIZ)
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM cgblocal WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo)
                        INSERT INTO cgblocal (
                            ciacodigo, loccodigo, locdescri, locstatus, locfecisys, lochorisys,
                            locusuisys, locfecmsys, lochormsys, locusumsys, ciadirec, locservidor
                        ) VALUES (
                            :ciacodigo, :loccodigo, :locdescri, :locstatus, :locfecisys, :lochorisys,
                            :locusuisys, :locfecmsys, :lochormsys, :locusumsys, :ciadirec, :locservidor
                        )
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "loccodigo": "01",
                        "locdescri": "MATRIZ",
                        "locstatus": "A",
                        "locfecisys": fecha_actual,
                        "lochorisys": hora_sys,
                        "locusuisys": sUsuario,
                        "locfecmsys": fecha_actual,
                        "lochormsys": hora_sys,
                        "locusumsys": sUsuario,
                        "ciadirec": "",
                        "locservidor": "S",
                    },
                )

                # 12. INSERT en siactloc
                # Primer usuario: el que crea la compañía
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM siactloc WHERE usrcodigo = :usrcodigo AND ciacodigo = :ciacodigo AND loccodigo = :loccodigo)
                        INSERT INTO siactloc (
                            ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys
                        ) VALUES (
                            :ciacodigo, :usrcodigo, :loccodigo, :locfecmsys, :lochormsys, :locusumsys
                        )
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "usrcodigo": encriptar(sUsuario),
                        "loccodigo": "01",
                        "locfecmsys": fecha_actual,
                        "lochormsys": hora_sys,
                        "locusumsys": sUsuario,
                    },
                )
                # Segundo usuario: nuevo usuario extra
                conn_company.execute(
                    text(
                        """
                        IF NOT EXISTS (SELECT 1 FROM siactloc WHERE usrcodigo = :usrcodigo AND ciacodigo = :ciacodigo AND loccodigo = :loccodigo)
                        INSERT INTO siactloc (
                            ciacodigo, usrcodigo, loccodigo, locfecmsys, lochormsys, locusumsys
                        ) VALUES (
                            :ciacodigo, :usrcodigo, :loccodigo, :locfecmsys, :lochormsys, :locusumsys
                        )
                    """
                    ),
                    {
                        "ciacodigo": ciacodigo,
                        "usrcodigo": encriptar(fsbs_new_cliciausu),
                        "loccodigo": "01",
                        "locfecmsys": fecha_actual,
                        "lochormsys": hora_sys,
                        "locusumsys": sUsuario,
                    },
                )

                # Commit en AMBAS (solo si todo fue exitoso)
                trans_company.commit()
                trans_fsbs.commit()
            except Exception as e:
                # Rollback automático en AMBAS
                trans_company.rollback()
                trans_fsbs.rollback()
                raise APIError(e)

    return {"data": "Compañía creada exitosamente"}
