from datetime import datetime

from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.TiposCliente import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError, api_endpoint


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
    "zoncodigo": 3,
    "regcodigo": 3,
    "procodigo": 3,
    "cliestciv": 15,
    "tipcodigo": 3,
    "cliobserva": 1000,
    "cliemail": 100,
    "website": 100,
    "clidirec2": 150,
    "ciucodigo": 3,
    "usrcodigo": 10,
    "clitelpref1": 5,
    "clitelpref2": 5,
    "clitelext1": 5,
    "clitelext2": 5,
    "calfcodigo": 15,
    "clisexo": 1,
    "clipersona": 1,
    "cliorigening": 1,
    "parrocodigo": 6,
    "agencodigo": 3,
    "agendescri": 150,
    "agendirec": 100,
    "agentelpref1": 5,
    "agentelef1": 15,
    "agentelext1": 5,
    "agentelpref2": 5,
    "agentelef2": 15,
    "agentelext2": 5,
    "agenemail": 100,
    "agenestisys": 30,
    "agecodrelext": 4,
    "condescri": 60,
    "concargo": 100,
    "contelpref1": 5,
    "contelef1": 15,
    "contelext1": 5,
    "contelpref2": 5,
    "contelef2": 15,
    "contelext2": 5,
    "concelular": 15,
    "conemail": 100,
    "areadescri": 60,
    "concomenta": 100,
    "concodrelext": 4,
}

INTEGER_FIELDS = {
    "clidiascrs",
    "cliprefac",
    "clidiascrd",
    "clidiapago",
    "clidiasrecibefac1",
    "clidiaentregafac",
    "clicuotaven",
    "cliconespecial",
}

DECIMAL_FIELDS = {
    "climontocrs",
    "clisalaplis",
    "climontocrd",
    "clisalaplid",
    "cliactivos",
    "clipasivos",
    "cliingresos",
    "cliegresos",
    "clipatrimonioneto",
}

BIT_FIELDS = {
    "cliapliiva",
    "clibloqueo",
    "cliivaped",
    "calificacion",
    "cliesfuncionario",
    "clienpolitica",
    "clidemanda",
    "clicastigada",
    "cliparterel",
}

DATE_FIELDS = {"clifecnac", "fecenvioxml"}

OPTIONAL_NULL_FIELDS = {
    "tipcodigo",
    "regcodigo",
    "zoncodigo",
    "procodigo",
    "ciucodigo",
    "parrocodigo",
    "activicodigo",
    "sectorcodigo",
    "usrcodigo",
    "calfcodigo",
    "activicodigocon",
}

SECTION_KEYS = {
    "vendedores",
    "refBancarias",
    "agencias",
    "contactos",
    "descuentosLineas",
    "descuentosArticulos",
    "historial",
    "auditLog",
}

IMMUTABLE_MAIN_FIELDS = {"ciacodigo", "clicodigo", "clifecisys", "clihorisys", "cliusuisys"}


def to_int(value, field_name):
    if value is None or value == "":
        return 0
    try:
        return int(float(value))
    except Exception as exc:
        raise ValidationError(f"{field_name}: valor entero inválido") from exc


def to_float(value, field_name):
    if value is None or value == "":
        return 0.0
    try:
        return float(value)
    except Exception as exc:
        raise ValidationError(f"{field_name}: valor decimal inválido") from exc


def to_bit(value):
    if value is None or value == "":
        return 0
    if isinstance(value, bool):
        return -1 if value else 0
    if isinstance(value, (int, float)):
        return 0 if int(value) == 0 else -1

    value_str = str(value).strip()
    upper = value_str.upper()
    if upper in ("TRUE", "T", "S", "SI", "YES", "Y"):
        return -1
    if upper in ("FALSE", "F", "N", "NO"):
        return 0

    try:
        return 0 if int(float(value_str)) == 0 else -1
    except (ValueError, TypeError):
        return 0


def to_date(value, field_name):
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    text_value = str(value).strip()
    if not text_value:
        return None

    for fmt in (
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%d/%m/%Y",
        "%a, %d %b %Y %H:%M:%S GMT",
    ):
        try:
            return datetime.strptime(text_value, fmt)
        except ValueError:
            pass

    try:
        iso_text = text_value.replace("Z", "+00:00")
        return datetime.fromisoformat(iso_text).replace(tzinfo=None)
    except Exception:
        pass

    raise ValidationError(f"{field_name}: fecha inválida")


def truncate_varchar(field_name, value):
    if value is None:
        return value
    str_value = str(value)
    max_len = VARCHAR_MAX_LENGTHS.get(field_name)
    if max_len and len(str_value) > max_len:
        return str_value[:max_len]
    return str_value


def normalize_main_value(field_name, value):
    if field_name in OPTIONAL_NULL_FIELDS:
        text_value = str(value).strip() if value is not None else ""
        return text_value if text_value else None
    if field_name in INTEGER_FIELDS:
        return to_int(value, field_name)
    if field_name in DECIMAL_FIELDS:
        return to_float(value, field_name)
    if field_name in BIT_FIELDS:
        return to_bit(value)
    if field_name in DATE_FIELDS:
        return to_date(value, field_name)
    return truncate_varchar(field_name, value)


def get_table_columns(connection, table_name):
    sql = text(
        """
        SELECT name
        FROM sys.columns
        WHERE object_id = OBJECT_ID(:table_name)
        """
    )
    rows = connection.execute(sql, {"table_name": table_name}).mappings().fetchall()
    return {row["name"] for row in rows}


def insert_rows(connection, sql_text, rows):
    if not rows:
        return
    stmt = text(sql_text)
    for row in rows:
        connection.execute(stmt, row)


def validate_vendedores_uniqueness(vend_rows):
    seen_localidades = set()
    for row in vend_rows:
        loccodigo = str(row.get("loccodigo") or "").strip()
        if not loccodigo:
            raise ValidationError("Vendedor/Ubicación: localidad es requerida")
        if loccodigo in seen_localidades:
            raise ValidationError(f"Vendedor/Ubicación: la localidad '{loccodigo}' está repetida")
        seen_localidades.add(loccodigo)


def parse_agencias(data, ciacodigo, clicodigo, user_name, station):
    agencies = data.get("agencias") or []
    if not isinstance(agencies, list):
        return []

    parsed = []
    next_code = 1

    for item in agencies:
        if not item:
            continue

        code = str(item.get("agencodigo") or item.get("codigo") or "").strip()
        if not code:
            code = str(next_code)
            next_code += 1

        agency = {
            "ciacodigo": ciacodigo,
            "clicodigo": clicodigo,
            "agencodigo": truncate_varchar("agencodigo", code),
            "agendescri": truncate_varchar("agendescri", item.get("agendescri") or item.get("descripcion") or ""),
            "agendirec": truncate_varchar("agendirec", item.get("agendirec") or item.get("direccion") or ""),
            "agentelpref1": truncate_varchar("agentelpref1", item.get("agentelpref1") or item.get("telPref1") or ""),
            "agentelef1": truncate_varchar("agentelef1", item.get("agentelef1") or item.get("telefono1") or ""),
            "agentelext1": truncate_varchar("agentelext1", item.get("agentelext1") or item.get("ext1") or ""),
            "agentelpref2": truncate_varchar("agentelpref2", item.get("agentelpref2") or item.get("telPref2") or ""),
            "agentelef2": truncate_varchar("agentelef2", item.get("agentelef2") or item.get("telefono2") or ""),
            "agentelext2": truncate_varchar("agentelext2", item.get("agentelext2") or item.get("ext2") or ""),
            "agenemail": truncate_varchar("agenemail", item.get("agenemail") or item.get("email") or ""),
            "regcodigo": truncate_varchar("regcodigo", item.get("regcodigo") or item.get("region") or data.get("regcodigo") or ""),
            "zoncodigo": truncate_varchar("zoncodigo", item.get("zoncodigo") or item.get("zona") or data.get("zoncodigo") or ""),
            "procodigo": truncate_varchar("procodigo", item.get("procodigo") or item.get("provincia") or data.get("procodigo") or ""),
            "ciucodigo": truncate_varchar("ciucodigo", item.get("ciucodigo") or item.get("ciudad") or data.get("ciucodigo") or ""),
            "agecodrelext": truncate_varchar("agecodrelext", item.get("agecodrelext") or item.get("codigoExterno") or ""),
            "agenfecisys": datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),
            "agenhorisys": datetime.now().replace(year=1900, month=1, day=1, microsecond=0),
            "agenusuisys": user_name,
            "agenestisys": station,
        }

        if not agency["agendirec"]:
            raise ValidationError("Agencias: dirección es requerida")
        if not agency["agentelef1"]:
            raise ValidationError("Agencias: teléfono1 es requerido")
        if not agency["agentelef2"]:
            raise ValidationError("Agencias: teléfono2 es requerido")
        if not agency["agenemail"]:
            raise ValidationError("Agencias: email es requerido")
        if not agency["regcodigo"]:
            raise ValidationError("Agencias: región es requerida")
        if not agency["zoncodigo"]:
            raise ValidationError("Agencias: zona es requerida")
        if not agency["procodigo"]:
            raise ValidationError("Agencias: provincia es requerida")
        if not agency["ciucodigo"]:
            raise ValidationError("Agencias: ciudad es requerida")

        parsed.append(agency)

    return parsed


def parse_contactos(data, ciacodigo, clicodigo, user_name, station):
    contactos = data.get("contactos") or []
    if not isinstance(contactos, list):
        return []

    parsed = []
    for item in contactos:
        if not item:
            continue

        condescri = str(item.get("condescri") or item.get("contacto") or "").strip()
        if not condescri:
            continue

        contact = {
            "ciacodigo": ciacodigo,
            "clicodigo": clicodigo,
            "agencodigo": truncate_varchar("agencodigo", item.get("agencodigo") or ""),
            "condescri": truncate_varchar("condescri", condescri),
            "concargo": truncate_varchar("concargo", item.get("concargo") or item.get("cargo") or ""),
            "contelpref1": truncate_varchar("contelpref1", item.get("contelpref1") or item.get("telPref1") or ""),
            "contelef1": truncate_varchar("contelef1", item.get("contelef1") or item.get("telefono1") or ""),
            "contelext1": truncate_varchar("contelext1", item.get("contelext1") or item.get("ext1") or ""),
            "contelpref2": truncate_varchar("contelpref2", item.get("contelpref2") or item.get("telPref2") or ""),
            "contelef2": truncate_varchar("contelef2", item.get("contelef2") or item.get("telefono2") or ""),
            "contelext2": truncate_varchar("contelext2", item.get("contelext2") or item.get("ext2") or ""),
            "concelular": truncate_varchar("concelular", item.get("concelular") or item.get("celular") or ""),
            "conemail": truncate_varchar("conemail", item.get("conemail") or item.get("email") or ""),
            "areadescri": truncate_varchar("areadescri", item.get("areadescri") or item.get("area") or ""),
            "concomenta": truncate_varchar("concomenta", item.get("concomenta") or item.get("comentario") or ""),
            "concodrelext": truncate_varchar("concodrelext", item.get("concodrelext") or item.get("externo") or ""),
            "convalviaje": to_float(item.get("convalviaje") if item.get("convalviaje") is not None else item.get("valViaje"), "convalviaje"),
            "confecisys": datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),
            "conhorisys": datetime.now().replace(year=1900, month=1, day=1, microsecond=0),
            "conusuisys": user_name,
            "conestisys": station,
        }

        if not contact["contelef1"]:
            raise ValidationError("Contactos: teléfono1 es requerido")
        if not contact["contelef2"]:
            raise ValidationError("Contactos: teléfono2 es requerido")
        if not contact["concelular"]:
            raise ValidationError("Contactos: celular es requerido")
        if not contact["conemail"]:
            raise ValidationError("Contactos: email es requerido")
        if not contact["concomenta"]:
            raise ValidationError("Contactos: comentario es requerido")

        parsed.append(contact)

    return parsed


def _contact_tuple_for_compare(contact):
    return (
        str(contact.get("agencodigo") or "").strip(),
        str(contact.get("condescri") or "").strip(),
        str(contact.get("concargo") or "").strip(),
        str(contact.get("contelpref1") or "").strip(),
        str(contact.get("contelef1") or "").strip(),
        str(contact.get("contelext1") or "").strip(),
        str(contact.get("contelpref2") or "").strip(),
        str(contact.get("contelef2") or "").strip(),
        str(contact.get("contelext2") or "").strip(),
        str(contact.get("concelular") or "").strip(),
        str(contact.get("conemail") or "").strip(),
        str(contact.get("areadescri") or "").strip(),
        str(contact.get("concomenta") or "").strip(),
        str(contact.get("concodrelext") or "").strip(),
        float(contact.get("convalviaje") or 0),
    )


def contactos_are_unchanged(connection, ciacodigo, clicodigo, new_contactos):
    sql = text(
        """
        SELECT agencodigo, condescri, concargo, contelpref1, contelef1, contelext1,
               contelpref2, contelef2, contelext2, concelular, conemail, areadescri,
               concomenta, concodrelext, convalviaje
        FROM cxctclicontactos
        WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
        """
    )
    existing_rows = connection.execute(sql, {"ciacodigo": ciacodigo, "clicodigo": clicodigo}).mappings().fetchall()

    existing_norm = sorted(
        _contact_tuple_for_compare(
            {
                "agencodigo": row.get("agencodigo"),
                "condescri": row.get("condescri"),
                "concargo": row.get("concargo"),
                "contelpref1": row.get("contelpref1"),
                "contelef1": row.get("contelef1"),
                "contelext1": row.get("contelext1"),
                "contelpref2": row.get("contelpref2"),
                "contelef2": row.get("contelef2"),
                "contelext2": row.get("contelext2"),
                "concelular": row.get("concelular"),
                "conemail": row.get("conemail"),
                "areadescri": row.get("areadescri"),
                "concomenta": row.get("concomenta"),
                "concodrelext": row.get("concodrelext"),
                "convalviaje": row.get("convalviaje"),
            }
        )
        for row in existing_rows
    )
    new_norm = sorted(_contact_tuple_for_compare(contact) for contact in new_contactos)

    return existing_norm == new_norm


def validate_contact_areas(connection, contactos):
    for contacto in contactos:
        area = str(contacto.get("areadescri") or "").strip()
        if not area:
            continue
        exists = (
            connection.execute(
                text("SELECT TOP 1 areadescri FROM cxcbareas WHERE areadescri = :area"),
                {"area": area},
            )
            .mappings()
            .first()
        )
        if not exists:
            raise ValidationError(f"Contactos: el área '{area}' no existe en el catálogo de áreas")


@bp.route("/editarTiposCliente", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def editarTiposCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        raise ValidationError("Body inválido")

    clicodigo = str(data.get("clicodigo") or "").strip()
    if not clicodigo:
        raise ValidationError("clicodigo es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                existing = (
                    connection.execute(
                        text("SELECT ciacodigo, clicodigo FROM cxcmcli WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )
                    .mappings()
                    .first()
                )
                if not existing:
                    raise ValidationError(f"No existe ningún registro con clave ({sCodCia}, {clicodigo})")

                allowed_columns = get_table_columns(connection, "cxcmcli")

                update_payload = {
                    "clifecmsys": datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),
                    "clihormsys": datetime.now().replace(year=1900, month=1, day=1, microsecond=0),
                    "cliusumsys": sUsuario,
                    "cliestmsys": sNomEst,
                }

                for key, value in data.items():
                    if key in SECTION_KEYS or key in IMMUTABLE_MAIN_FIELDS or key not in allowed_columns:
                        continue
                    update_payload[key] = normalize_main_value(key, value)

                if "clinombre" in update_payload and str(update_payload.get("clinombre") or "").strip() == "":
                    raise ValidationError("clinombre es requerido")
                if "clidirec" in update_payload and str(update_payload.get("clidirec") or "").strip() == "":
                    raise ValidationError("clidirec es requerido")

                if update_payload:
                    set_clause = ", ".join([f"{field} = :{field}" for field in update_payload.keys()])
                    update_sql = text(f"UPDATE cxcmcli SET {set_clause} WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo")
                    execute_payload = {**update_payload, "ciacodigo": sCodCia, "clicodigo": clicodigo}
                    connection.execute(update_sql, execute_payload)

                audit_sql = text(
                    """
                    INSERT INTO cxchmcli (
                        ciacodigo, clicodigo, cliaccion, clifecisys, clihorisys, cliusuisys,
                        clifecmsys, clihormsys, cliusumsys, cliestmsys, clinombre, cliruc,
                        clidiascrs, climontocrs, cliprefac, clistatus
                    )
                    SELECT
                        ciacodigo, clicodigo, 'UPDATE', clifecisys, clihorisys, cliusuisys,
                        clifecmsys, clihormsys, cliusumsys, cliestmsys, clinombre, cliruc,
                        clidiascrs, climontocrs, cliprefac, clistatus
                    FROM cxcmcli
                    WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
                    """
                )
                connection.execute(audit_sql, {"ciacodigo": sCodCia, "clicodigo": clicodigo})

                now_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                now_hour = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

                if "vendedores" in data:
                    connection.execute(
                        text("DELETE FROM cxctcliven WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )
                    vendedores = data.get("vendedores") or []
                    vend_rows = []
                    if isinstance(vendedores, list):
                        for item in vendedores:
                            if not item:
                                continue
                            vencodigo = str(item.get("vencodigo") or item.get("codigo") or "").strip()
                            if not vencodigo:
                                continue
                            vend_rows.append(
                                {
                                    "ciacodigo": sCodCia,
                                    "clicodigo": clicodigo,
                                    "vencodigo": vencodigo,
                                    "loccodigo": str(item.get("loccodigo") or item.get("codLocalidad") or item.get("local") or "").strip(),
                                    "venfecisys": now_date,
                                    "venhorisys": now_hour,
                                    "venusuisys": sUsuario,
                                    "venestisys": sNomEst,
                                }
                            )
                    validate_vendedores_uniqueness(vend_rows)
                    insert_rows(
                        connection,
                        """
                        INSERT INTO cxctcliven (ciacodigo, clicodigo, vencodigo, loccodigo, venfecisys, venhorisys, venusuisys, venestisys)
                        VALUES (:ciacodigo, :clicodigo, :vencodigo, :loccodigo, :venfecisys, :venhorisys, :venusuisys, :venestisys)
                        """,
                        vend_rows,
                    )

                if "refBancarias" in data:
                    connection.execute(
                        text("DELETE FROM cxctclireferencias WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )
                    referencias = data.get("refBancarias") or []
                    ref_rows = []
                    if isinstance(referencias, list):
                        for item in referencias:
                            if not item:
                                continue
                            bcocodigo = str(item.get("bcocodigo") or item.get("codigo") or "").strip()
                            if not bcocodigo:
                                continue
                            ref_rows.append(
                                {
                                    "ciacodigo": sCodCia,
                                    "clicodigo": clicodigo,
                                    "bcotipo": str(item.get("bcotipo") or item.get("tipoCuenta") or "").strip(),
                                    "bcocodigo": bcocodigo,
                                    "bconumcta": str(item.get("bconumcta") or item.get("numero") or "").strip(),
                                    "boccalifi": str(item.get("boccalifi") or item.get("calificacion") or "").strip(),
                                    "bcofecape": to_date(
                                        item.get("bcofecape") or item.get("fechaApertura"),
                                        "Referencias bancarias: fecha de apertura",
                                    ),
                                    "bcofemsys": now_date,
                                    "bcohormsys": now_hour,
                                    "bcousumsys": sUsuario,
                                    "bcoestmsys": sNomEst,
                                }
                            )
                    insert_rows(
                        connection,
                        """
                        INSERT INTO cxctclireferencias (ciacodigo, clicodigo, bcotipo, bcocodigo, bconumcta, boccalifi, bcofecape, bcofemsys, bcohormsys, bcousumsys, bcoestmsys)
                        VALUES (:ciacodigo, :clicodigo, :bcotipo, :bcocodigo, :bconumcta, :boccalifi, :bcofecape, :bcofemsys, :bcohormsys, :bcousumsys, :bcoestmsys)
                        """,
                        ref_rows,
                    )

                if "agencias" in data:
                    connection.execute(
                        text("DELETE FROM cxctcliagencias WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )
                    agencias = parse_agencias(data, sCodCia, clicodigo, sUsuario, sNomEst)
                    insert_rows(
                        connection,
                        """
                        INSERT INTO cxctcliagencias (
                            ciacodigo, clicodigo, agencodigo, agendescri, agendirec,
                            agentelpref1, agentelef1, agentelext1, agentelpref2, agentelef2, agentelext2,
                            agenemail, regcodigo, zoncodigo, procodigo, ciucodigo,
                            agecodrelext, agenfecisys, agenhorisys, agenusuisys, agenestisys
                        )
                        VALUES (
                            :ciacodigo, :clicodigo, :agencodigo, :agendescri, :agendirec,
                            :agentelpref1, :agentelef1, :agentelext1, :agentelpref2, :agentelef2, :agentelext2,
                            :agenemail, :regcodigo, :zoncodigo, :procodigo, :ciucodigo,
                            :agecodrelext, :agenfecisys, :agenhorisys, :agenusuisys, :agenestisys
                        )
                        """,
                        agencias,
                    )

                if "contactos" in data:
                    contactos = parse_contactos(data, sCodCia, clicodigo, sUsuario, sNomEst)
                    if not contactos_are_unchanged(connection, sCodCia, clicodigo, contactos):
                        validate_contact_areas(connection, contactos)
                        connection.execute(
                            text("DELETE FROM cxctclicontactos WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                            {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                        )
                        insert_rows(
                            connection,
                            """
                            INSERT INTO cxctclicontactos (
                                ciacodigo, clicodigo, agencodigo, condescri, concargo,
                                contelpref1, contelef1, contelext1, contelpref2, contelef2, contelext2,
                                concelular, conemail, areadescri, concomenta, concodrelext,
                                convalviaje, confecisys, conhorisys, conusuisys, conestisys
                            )
                            VALUES (
                                :ciacodigo, :clicodigo, :agencodigo, :condescri, :concargo,
                                :contelpref1, :contelef1, :contelext1, :contelpref2, :contelef2, :contelext2,
                                :concelular, :conemail, :areadescri, :concomenta, :concodrelext,
                                :convalviaje, :confecisys, :conhorisys, :conusuisys, :conestisys
                            )
                            """,
                            contactos,
                        )

                if "descuentosLineas" in data:
                    connection.execute(
                        text("DELETE FROM cxcbclidesc WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )
                    line_rows = []
                    descuentos_linea = data.get("descuentosLineas") or []
                    if isinstance(descuentos_linea, list):
                        for item in descuentos_linea:
                            if not item:
                                continue
                            lincodigo = str(item.get("lincodigo") or item.get("linea") or "").strip()
                            if not lincodigo:
                                continue
                            line_rows.append(
                                {
                                    "ciacodigo": sCodCia,
                                    "clicodigo": clicodigo,
                                    "lincodigo": lincodigo,
                                    "marcodigo": str(item.get("marcodigo") or item.get("marca") or "").strip(),
                                    "desporcentaje": to_float(item.get("desporcentaje") if item.get("desporcentaje") is not None else item.get("porcentaje"), "desporcentaje"),
                                    "deslistaprecio": to_int(item.get("deslistaprecio") if item.get("deslistaprecio") is not None else item.get("listaPrecios"), "deslistaprecio"),
                                    "desfecisys": now_date,
                                    "deshorisys": now_hour,
                                    "desusuisys": sUsuario,
                                    "desestisys": sNomEst,
                                    "desfecmsys": now_date,
                                    "deshormsys": now_hour,
                                    "desusumsys": sUsuario,
                                    "desestmsys": sNomEst,
                                }
                            )
                    insert_rows(
                        connection,
                        """
                        INSERT INTO cxcbclidesc (ciacodigo, clicodigo, lincodigo, marcodigo, desporcentaje, deslistaprecio, desfecisys, deshorisys, desusuisys, desestisys, desfecmsys, deshormsys, desusumsys, desestmsys)
                        VALUES (:ciacodigo, :clicodigo, :lincodigo, :marcodigo, :desporcentaje, :deslistaprecio, :desfecisys, :deshorisys, :desusuisys, :desestisys, :desfecmsys, :deshormsys, :desusumsys, :desestmsys)
                        """,
                        line_rows,
                    )

                if "descuentosArticulos" in data:
                    connection.execute(
                        text("DELETE FROM cxcbclidescart WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )
                    art_rows = []
                    descuentos_art = data.get("descuentosArticulos") or []
                    if isinstance(descuentos_art, list):
                        for item in descuentos_art:
                            if not item:
                                continue
                            artcodigo = str(item.get("artcodigo") or item.get("articulo") or "").strip()
                            if not artcodigo:
                                continue
                            art_rows.append(
                                {
                                    "ciacodigo": sCodCia,
                                    "clicodigo": clicodigo,
                                    "artcodigo": artcodigo,
                                    "invcodigo": str(item.get("invcodigo") or "").strip(),
                                    "desporcentaje": to_float(item.get("desporcentaje") if item.get("desporcentaje") is not None else item.get("porcentaje"), "desporcentaje"),
                                    "deslistaprecio": to_int(item.get("deslistaprecio") if item.get("deslistaprecio") is not None else item.get("listaPrecios"), "deslistaprecio"),
                                    "desfecisys": now_date,
                                    "deshorisys": now_hour,
                                    "desusuisys": sUsuario,
                                    "desestisys": sNomEst,
                                    "desfecmsys": now_date,
                                    "deshormsys": now_hour,
                                    "desusumsys": sUsuario,
                                    "desestmsys": sNomEst,
                                }
                            )
                    insert_rows(
                        connection,
                        """
                        INSERT INTO cxcbclidescart (ciacodigo, clicodigo, artcodigo, invcodigo, desporcentaje, deslistaprecio, desfecisys, deshorisys, desusuisys, desestisys, desfecmsys, deshormsys, desusumsys, desestmsys)
                        VALUES (:ciacodigo, :clicodigo, :artcodigo, :invcodigo, :desporcentaje, :deslistaprecio, :desfecisys, :deshorisys, :desusuisys, :desestisys, :desfecmsys, :deshormsys, :desusumsys, :desestmsys)
                        """,
                        art_rows,
                    )

                if "historial" in data:
                    connection.execute(
                        text("DELETE FROM cxctclihistorial WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo"),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )
                    hist_rows = []
                    historial = data.get("historial") or []
                    if isinstance(historial, list):
                        for idx, item in enumerate(historial, start=1):
                            if not item:
                                continue
                            obs = str(item.get("obsobserva") or item.get("observacion") or "").strip()
                            if not obs:
                                continue
                            hist_rows.append(
                                {
                                    "ciacodigo": sCodCia,
                                    "clicodigo": clicodigo,
                                    "obssecuen": idx,
                                    "obsobserva": obs,
                                    "obsusuisys": str(item.get("obsusuisys") or item.get("usuario") or sUsuario),
                                    "obsestisys": str(item.get("obsestisys") or item.get("estacion") or sNomEst),
                                    "obsfecisys": to_date(item.get("obsfecisys") or item.get("fechaRaw"), "obsfecisys") or now_date,
                                    "obshorisys": to_date(item.get("obshorisys") or item.get("horaRaw"), "obshorisys") or now_hour,
                                }
                            )
                    insert_rows(
                        connection,
                        """
                        INSERT INTO cxctclihistorial (ciacodigo, clicodigo, obssecuen, obsobserva, obsusuisys, obsestisys, obsfecisys, obshorisys)
                        VALUES (:ciacodigo, :clicodigo, :obssecuen, :obsobserva, :obsusuisys, :obsestisys, :obsfecisys, :obshorisys)
                        """,
                        hist_rows,
                    )

    except IntegrityError as exc:
        detail = str(getattr(exc, "orig", exc))
        message = "Error de integridad de datos en la base de datos."
        txt = str(exc)
        if "FK_cxcmcli_cxcbtipcli" in txt:
            message = "Generales: el Tipo de Cliente seleccionado no existe o es inválido."
        elif "FK_cxctcliagencias_fapzona" in txt:
            message = "Agencias: la zona seleccionada no existe para la compañía actual."
        elif "FK_cxctcliagencias_cxcbreg" in txt:
            message = "Agencias: la región seleccionada no existe para la compañía actual."
        elif "FK_cxctcliagencias_rhbprov" in txt:
            message = "Agencias: la provincia seleccionada no existe."
        elif "FK_cxctclicontactos_cxcbareas" in txt:
            message = "En Contactos, el área seleccionada no existe en el catálogo de áreas."
        elif "pk_cxctcliven" in txt:
            message = "Vendedor/Ubicación: no se puede repetir la localidad para el mismo cliente."
        elif "FOREIGN KEY" in txt or "FK_" in txt:
            message = "El registro está relacionado con otros datos. No se puede actualizar."
        elif "UNIQUE" in txt or "AK_" in txt:
            message = "Ya existe un registro con estos datos únicos."
        return {"success": False, "message": message, "details": detail}

    return {"data": "Registro actualizado correctamente"}
