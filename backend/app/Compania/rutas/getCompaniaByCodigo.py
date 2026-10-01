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
                    s.ciacodigo,
                    s.ciaanioejer,
                    s.ciaauxcredito,
                    s.ciacontador,
                    s.ciadescri,
                    s.ciaalias,
                    s.ciaruc,
                    s.ciadirec,
                    s.ciafax,
                    s.ciafecisys,
                    s.ciafecminacc,
                    s.ciafecmsys,
                    s.ciaforcencos,
                    s.ciaforlin,
                    s.ciagerente,
                    s.ciahorisys,
                    s.ciahormsys,
                    s.cianivelescc,
                    s.cianiveleslin,
                    s.ciapresidente,
                    s.ciarecsalmen,
                    s.ciaregcont,
                    s.ciastatus,
                    s.ciatelefono1,
                    s.ciatelefono2,
                    s.ciausuisys,
                    s.ciausumsys,
                    s.ciavigilancia,
                    s.ciaciudad,
                    s.ciapais,
                    s.ciaescontesp,
                    s.ciaemail,
                    s.ciaweb,
                    s.ciaanioinicon,
                    s.ciaforpre,
                    s.cianivelespre,
                    s.ciadiasnc,
                    s.ciacedgerente,
                    s.ciahelpart,
                    s.ciacantfor,
                    s.ciacostfor,
                    s.ciavehele,
                    s.ciapresupuesto,
                    s.ciafecinipre,
                    s.ciaforcta,
                    s.cianivelescta,
                    s.ciasrirazon,
                    s.ciasrifono,
                    s.ciasrifax,
                    s.ciasriemail,
                    s.ciasriruccontador,
                    s.ciatipoidengerente,
                    s.ciasridirmatriz,
                    s.ciasridocautventas,
                    s.ciasrinotdebventas,
                    s.ciasrinotcreventas,
                    s.ciasriretfueventas,
                    s.ciacodlocmatriz,
                    s.generacodian,
                    s.coscodigo,
                    s.aplitransing,
                    s.apliserie,
                    s.codclisec,
                    s.codprosec,
                    s.ciasecuencliente,
                    s.ciasecuenproveedor,
                    s.ciasecuentarjeta,
                    s.codartsec,
                    s.ciasecuenartventa,
                    s.ciasecuenarticulo,
                    s.ciaactualizaprecios,
                    s.cianumresolucion,
                    s.ciafecresolucion,
                    s.CiaNivelOrg,
                    s.ciafororg,
                    s.cianumvend,
                    s.ciasolautfactcxp,
                    s.ciaaproautfactcxp,
                    s.ciasolautanticxp,
                    s.ciaaproautanticxp,
                    s.ciasolautpagocxp,
                    s.ciaaproautpagocxp,
                    s.ciaaaocimport,
                    s.ciaaaocserv,
                    s.ciaaaocgasta,
                    s.ciaaaoclocal,
                    s.ciaaaocgastasoc,
                    s.ciafacitemrep,
                    s.ciasecuenemple,
                    s.ciasecuencargo,
                    s.ciavalprecost,
                    s.ciaporretiva,
                    s.ciaporretfuente,
                    s.ciactapagolote,
                    s.ciatipoocfaclote,
                    s.ciaivaservicio,
                    s.ciafacelectronica,
                    s.versionfac,
                    s.ciapdfelectronica,
                    s.versionpdf,
                    s.ciaambienteelectronica,
                    s.srimicroempresa,
                    s.sricartera,
                    s.sriguia,
                    s.sriagenteretencion,
                    s.sriagenteretencionnumres,
                    s.ciaregimenemprendedores,
                    s.ciaregimenpopular,
                    s.ciaregimengeneral,
                    s.sricorreoffice,
                    s.sricopiacorreo,
                    s.srimensajefactura,
                    s.srissltls,
                    s.srioffini,
                    s.sriofffin,
                    s.ciaaaocliqcomloc,
                    s.ciaaaocliqcomimp,
                    s.ciaaaocliqcomser,
                    s.ciaaaocppe,
                    s.ciacobrapuntos,
                    s.ciacobracupos,
                    s.ciacobrafundacion,
                    s.ciancbeneficiario,
                    s.ciainmobiliaria,
                    s.ciancdevcxccia,
                    s.ciadiasretencion,
                    s.ciadiasemitirretencion,
                    s.ciapropina,
                    s.ciacontabilidad,
                    s.ciaetiquetaadiret,
                    s.ciavaloradiret,
                    s.ciasolautclcxp,
                    s.ciaaproautclcxp,
                    s.cialogo,
                    s.ciaselloagua,
                    s.ciaivaporproducto,
                    s.ciafacDeVariosLoc,
                    s.cialistprecdefweb,
                    s.ciavalidaemp,
                    s.ciabasepuntos,
                    s.ciatipocompania,
                    -- Campos espejo del último régimen tributario:
                    -- se devuelven con los nombres que el frontend espera.
                    r.regagentretencionfecres AS sriagenteretencionfecres,
                    r.regllevarcontabilidadnumres AS ciacontabilidadnumres,
                    r.regllevarcontabilidadfecres AS ciacontabilidadfecres,
                    r.regpresidentecedula AS ciacedpresidente
                FROM siaccia s
                LEFT JOIN siacciaregtributario r
                    ON r.ciacodigo = s.ciacodigo
                    AND r.regsecuencia = (
                        SELECT MAX(regsecuencia)
                        FROM siacciaregtributario
                        WHERE ciacodigo = s.ciacodigo
                    )
                WHERE s.ciacodigo = :ciacodigo
                """
            )
            row = connection.execute(query, {"ciacodigo": ciacodigo}).mappings().fetchone()

    if not row:
        raise ValidationError(f"No se encontró la compañía con código '{ciacodigo}'")

    compania_data = {key: value for key, value in dict(row).items()}
    compania_data["cialogo"] = serialize_image(row.get("cialogo"))
    compania_data["ciaselloagua"] = serialize_image(row.get("ciaselloagua"))

    return jsonify({"data": compania_data})
