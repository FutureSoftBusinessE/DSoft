import base64

from flask import jsonify, request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Compania import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError


def serialize_image(value):
    if not value:
        return None
    return base64.b64encode(value).decode("utf-8").replace("\n", "")


@bp.route("/getCompaniaByCodigo", methods=["POST"])
@jwt_required()
def getCompaniaByCodigo():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json() or {}
    ciacodigo = (data.get("ciacodigo") or "").strip()

    if not ciacodigo:
        raise ValidationError("ciacodigo es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = text(
                """
                SELECT
                    ciacodigo,
                    ciaanioejer,
                    ciaauxcredito,
                    ciacontador,
                    ciadescri,
                    ciaalias,
                    ciaruc,
                    ciadirec,
                    ciafax,
                    ciafecisys,
                    ciafecminacc,
                    ciafecmsys,
                    ciaforcencos,
                    ciaforlin,
                    ciagerente,
                    ciahorisys,
                    ciahormsys,
                    cianivelescc,
                    cianiveleslin,
                    ciapresidente,
                    ciarecsalmen,
                    ciaregcont,
                    ciastatus,
                    ciatelefono1,
                    ciatelefono2,
                    ciausuisys,
                    ciausumsys,
                    ciavigilancia,
                    ciaciudad,
                    ciapais,
                    ciaescontesp,
                    ciaemail,
                    ciaweb,
                    ciaanioinicon,
                    ciaforpre,
                    cianivelespre,
                    ciadiasnc,
                    ciacedgerente,
                    ciahelpart,
                    ciacantfor,
                    ciacostfor,
                    ciavehele,
                    ciapresupuesto,
                    ciafecinipre,
                    ciaforcta,
                    cianivelescta,
                    ciasrirazon,
                    ciasrifono,
                    ciasrifax,
                    ciasriemail,
                    ciasriruccontador,
                    ciatipoidengerente,
                    ciasridirmatriz,
                    ciasridocautventas,
                    ciasrinotdebventas,
                    ciasrinotcreventas,
                    ciasriretfueventas,
                    ciacodlocmatriz,
                    generacodian,
                    coscodigo,
                    aplitransing,
                    apliserie,
                    codclisec,
                    codprosec,
                    ciasecuencliente,
                    ciasecuenproveedor,
                    ciasecuentarjeta,
                    codartsec,
                    ciasecuenartventa,
                    ciasecuenarticulo,
                    ciaactualizaprecios,
                    cianumresolucion,
                    ciafecresolucion,
                    CiaNivelOrg,
                    ciafororg,
                    cianumvend,
                    ciasolautfactcxp,
                    ciaaproautfactcxp,
                    ciasolautanticxp,
                    ciaaproautanticxp,
                    ciasolautpagocxp,
                    ciaaproautpagocxp,
                    ciaaaocimport,
                    ciaaaocserv,
                    ciaaaocgasta,
                    ciaaaoclocal,
                    ciaaaocgastasoc,
                    ciafacitemrep,
                    ciasecuenemple,
                    ciasecuencargo,
                    ciavalprecost,
                    ciaporretiva,
                    ciaporretfuente,
                    ciactapagolote,
                    ciatipoocfaclote,
                    ciaivaservicio,
                    ciafacelectronica,
                    versionfac,
                    ciapdfelectronica,
                    versionpdf,
                    ciaambienteelectronica,
                    srimicroempresa,
                    sricartera,
                    sriguia,
                    sriagenteretencion,
                    sriagenteretencionnumres,
                    sricorreoffice,
                    sricopiacorreo,
                    srimensajefactura,
                    srissltls,
                    srioffini,
                    sriofffin,
                    ciaaaocliqcomloc,
                    ciaaaocliqcomimp,
                    ciaaaocliqcomser,
                    ciaaaocppe,
                    ciacobrapuntos,
                    ciacobracupos,
                    ciacobrafundacion,
                    ciancbeneficiario,
                    ciainmobiliaria,
                    ciancdevcxccia,
                    ciadiasretencion,
                    ciadiasemitirretencion,
                    ciapropina,
                    ciacontabilidad,
                    ciaetiquetaadiret,
                    ciavaloradiret,
                    ciasolautclcxp,
                    ciaaproautclcxp,
                    cialogo,
                    ciaselloagua,
                    ciaivaporproducto,
                    ciafacDeVariosLoc,
                    cialistprecdefweb,
                    ciavalidaemp,
                    ciabasepuntos
                FROM siaccia
                WHERE ciacodigo = :ciacodigo
                """
            )
            row = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchone()

    if not row:
        raise ValidationError(f"No se encontró la compañía con código '{ciacodigo}'")

    compania_data = {key: value for key, value in dict(row).items()}
    compania_data["cialogo"] = serialize_image(row.get("cialogo"))
    compania_data["ciaselloagua"] = serialize_image(row.get("ciaselloagua"))

    return jsonify({"data": compania_data})
