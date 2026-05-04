from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.Localidad import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError


@bp.route("/getLocalidadByCodigo", methods=["POST"])
@cross_origin()
@jwt_required()
def getLocalidadByCodigo():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json() or {}
    ciacodigo = (data.get("ciacodigo") or "").strip()
    loccodigo = (data.get("loccodigo") or "").strip()

    if not ciacodigo:
        raise ValidationError("ciacodigo es requerido")
    if not loccodigo:
        raise ValidationError("loccodigo es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            query = text(
                """
                    SELECT
                            ciacodigo, loccodigo, locdescri, locstatus, locfecisys, lochorisys, locusuisys,
                            locfecmsys, lochormsys, locusumsys, ttrcodigo, seqcodigo, sercesion, factippag,
                            secndmig, secncmig, ndfcodigo, ciaruc, ciadirec, ciaciudad, ciapais, ciatelefono1,
                            ciatelefono2, ciafax, ciaemail, ciaseccobfac, ciaseccobdoc, ciasecinvnc, fafaccob,
                            fadesglobal, fatrainv, fasumadesc, fanumlin, fatraanu, famimpser, famporser,
                            famrecporval, fampor1, tipcodigo, forpagnd, vencodigo, zoncodigo, ncfcodigo,
                            repbodcod, seqantdocgar, cablin1, cablin2, cablin3, cablin4, pielin1, pielin2,
                            pielin3, pielin4, parfecven, pardiasven, unicodigo, procodigo, regcodigo, bodcodpro,
                            invcodpro, pacodingre, pacodegre, pacodingdev, pacodegprest, pacodinggar,
                            pacodegrgar, pacodegrpro, painvcodgar, pabodcodgar, seqcodigonc, sercodigo,
                            tracodproing, tracodproegr, seqcodigondm, sercodigondm, invemiped, forpagun,
                            cencosun, tipordcom, tipclipro, probodcod, propormano, proporrepuesto,
                            tipordcomser, seqndref, seqncmref, seqcobref, serndref, serncintref, serncref,
                            paramcod1, paramcod2, paramcod3, paramcod4, paramcod5, paramcod6, paramval1,
                            paramval2, paramval3, paramval4, paramval5, paramval6, tracodingloc, locfecinicxc,
                            clicodingprod, procodingprod, flagapruanti, feccorpedveh, seqcesion, ciaprovincia,
                            tarseqnd, tarforpag, tarser00, tarrecau, tarser01, tarser02, tarser03, tarser04,
                            tarseqndint, tarserint, tarforpagint, tarsecncrotdif, tarserncrotdif, tartiponccom,
                            tarsecncpuntos, tarserncpuntos, tarvalcomigen, tarcanapligen, tarvalcomiart,
                            tarcanapliart, tarsecant, tarseccob, cjacodigonc, tardiasventrans, emailsmtp,
                            emailmascara, emailsalida, emailtema, emailmensaje, locpathxml, prescodigo,
                            presaplicaquin, presaplicamens, prestipcliempl, presseccobro, pressecncmon,
                            presserncmon, sertarpos, tipoingoc, tipoegroc, diasvenoc, secantoc, valorminimooc,
                            locservidor, guianumlin, locpathxmldocemitidos, locpathxmldocanulados, ciucodigo,
                            activicodigo, sectorcodigo, clivendedor, tbliqcaja, tbliqviatico, traegrped,
                            traingped, bcoliqviatico, notapedido1, notapedido2, notaoc, invtrapresegr,
                            invtrapresing, sercodigotransporte, notacertificado, clavep12, paramcoding,
                            paramtipond, paramtiponc, paramstnd, paramstnc, paramtcnd, paramtcnc,
                            parambodingegr, ctaivapagadobien, ctaivapagadoserv, emailsubject, caducidadp12,
                            locflagcupon, locvalcupon, locfecinicupon, locfecfincupon, parrocodigo, clidiascrs,
                            climontocrs
                    FROM cgblocal
                    WHERE ciacodigo = :ciacodigo
                        AND loccodigo = :loccodigo
                """
            )
            row = connection.execute(query, {"ciacodigo": ciacodigo, "loccodigo": loccodigo}).mappings().fetchone()

    if not row:
        raise ValidationError(f"No se encontró la localidad ({ciacodigo}, {loccodigo})")

    return jsonify({"data": dict(row)})
