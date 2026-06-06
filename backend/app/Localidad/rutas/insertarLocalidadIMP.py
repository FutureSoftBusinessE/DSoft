from datetime import datetime
from decimal import Decimal

from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Localidad import bp
from app.Localidad.rutas.validarLocalidadIMP import validar_localidad
from app.db import get_session
from app.extensions import db
from error_handling import api_endpoint


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


# Son las columnas de la tabla cgblocal
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

TEXT_FIELDS = {column for column in ALL_COLUMNS if column not in INT_FIELDS and column not in DECIMAL_FIELDS and column not in DATETIME_FIELDS}

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


@bp.route("/insertarLocalidadIMP", methods=["POST"])
@jwt_required()
@api_endpoint
def insertarLocalidadIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    data = request.get_json() or {}

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

    with engine.connect() as connection:
        with connection.begin():
            rows, summary = validar_localidad(connection, columns, required, key_columns, rows_csv)

            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se insertó nada: la validación falló",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # Construir parámetros de inserción por cada fila válida
            to_insert = []
            for fila in rows:
                payload = {}
                for column in ALL_COLUMNS:
                    if column == "locfecisys":
                        payload[column] = fecha_actual
                    elif column == "lochorisys":
                        payload[column] = hora_sys
                    elif column == "locusuisys":
                        payload[column] = sUsuario
                    elif column == "locfecmsys":
                        payload[column] = fecha_actual
                    elif column == "lochormsys":
                        payload[column] = hora_sys
                    elif column == "locusumsys":
                        payload[column] = sUsuario
                    else:
                        value = fila.get(column)
                        payload[column] = apply_no_null_default(column, value)

                to_insert.append(payload)

            # ════════════════════════════════════════════════════════════════════════
            # Verificar y crear automáticamente registros en siac_local_sin_licencia si es necesario
            # ════════════════════════════════════════════════════════════════════════
            for payload in to_insert:
                ciacodigo = payload.get("ciacodigo")
                loccodigo = payload.get("loccodigo")

                if ciacodigo and loccodigo:
                    # Verificar si ya existe
                    check_fk = text(
                        """
                        SELECT 1
                        FROM siac_local_sin_licencia
                        WHERE ciacodigo = :ciacodigo
                          AND loccodigo = :loccodigo
                        """
                    )
                    fk_exists = connection.execute(check_fk, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).first()

                    # Si no existe, crear automáticamente
                    if not fk_exists:
                        insert_fk = text(
                            """
                            INSERT INTO siac_local_sin_licencia (ciacodigo, loccodigo, locmensaje, loclicencia)
                            VALUES (:ciacodigo, :loccodigo, :locmensaje, :loclicencia)
                            """
                        )
                        connection.execute(insert_fk, {"ciacodigo": ciacodigo, "loccodigo": loccodigo, "locmensaje": "Localidad registrada automáticamente", "loclicencia": "N"})

            insert_sql = text(f"INSERT INTO cgblocal ({', '.join(ALL_COLUMNS)}) VALUES ({', '.join([f':{column}' for column in ALL_COLUMNS])})")
            connection.execute(insert_sql, to_insert)

    return {"data": "Localidades insertadas exitosamente", "inserted": len(to_insert)}
