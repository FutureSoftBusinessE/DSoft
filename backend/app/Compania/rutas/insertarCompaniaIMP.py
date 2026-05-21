from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.Compania import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint
from app.Compania.rutas.validarCompaniaIMP import validar_compania


@bp.route("/insertarCompaniaIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarCompaniaIMP():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]

    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

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
        with connection.begin():
            rows, summary = validar_compania(connection, columns, required, key_columns, rows_csv)

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
                to_insert.append(
                    {
                        "ciacodigo": fila.get("ciacodigo"),
                        "ciaanioejer": fila.get("ciaanioejer") or "",
                        "ciaauxcredito": fila.get("ciaauxcredito") or "",
                        "ciacontador": fila.get("ciacontador") or "",
                        "ciadescri": fila.get("ciadescri") or "",
                        "ciaalias": fila.get("ciaalias") or "",
                        "ciaruc": fila.get("ciaruc") or "",
                        "ciadirec": fila.get("ciadirec") or "",
                        "ciafax": fila.get("ciafax") or "",
                        "ciafecisys": fecha_actual,
                        "ciafecminacc": fila.get("ciafecminacc") or "",
                        "ciafecmsys": fecha_actual,
                        "ciaforcencos": fila.get("ciaforcencos") or "",
                        "ciaforlin": fila.get("ciaforlin") or "",
                        "ciagerente": fila.get("ciagerente") or "",
                        "ciahorisys": hora_sys,
                        "ciahormsys": hora_sys,
                        "cianivelescc": fila.get("cianivelescc") or "",
                        "cianiveleslin": fila.get("cianiveleslin") or "",
                        "ciapresidente": fila.get("ciapresidente") or "",
                        "ciarecsalmen": fila.get("ciarecsalmen") or "",
                        "ciaregcont": fila.get("ciaregcont") or "",
                        "ciastatus": fila.get("ciastatus") or "",
                        "ciatelefono1": fila.get("ciatelefono1") or "",
                        "ciatelefono2": fila.get("ciatelefono2") or "",
                        "ciausuisys": sUsuario,
                        "ciausumsys": sUsuario,
                        "ciavigilancia": fila.get("ciavigilancia") or "",
                        "ciaciudad": fila.get("ciaciudad") or "",
                        "ciapais": fila.get("ciapais") or "",
                        "ciaescontesp": fila.get("ciaescontesp") or "",
                        "ciaemail": fila.get("ciaemail") or "",
                        "ciaweb": fila.get("ciaweb") or "",
                        "ciaanioinicon": fila.get("ciaanioinicon") or "",
                        "ciaforpre": fila.get("ciaforpre") or "",
                        "cianivelespre": fila.get("cianivelespre") or "",
                        "ciadiasnc": fila.get("ciadiasnc") or "",
                        "ciacedgerente": fila.get("ciacedgerente") or "",
                        "ciahelpart": fila.get("ciahelpart") or "",
                        "ciacantfor": fila.get("ciacantfor") or "",
                        "ciacostfor": fila.get("ciacostfor") or "",
                        "ciavehele": fila.get("ciavehele") or "",
                        "ciapresupuesto": fila.get("ciapresupuesto"),
                        "ciafecinipre": fila.get("ciafecinipre") or "",
                        "ciaforcta": fila.get("ciaforcta") or "",
                        "cianivelescta": fila.get("cianivelescta"),
                        "ciasrirazon": fila.get("ciasrirazon") or "",
                        "ciasrifono": fila.get("ciasrifono") or "",
                        "ciasrifax": fila.get("ciasrifax") or "",
                        "ciasriemail": fila.get("ciasriemail") or "",
                        "ciasriruccontador": fila.get("ciasriruccontador") or "",
                        "ciatipoidengerente": fila.get("ciatipoidengerente") or "",
                        "ciasridirmatriz": fila.get("ciasridirmatriz") or "",
                        "ciasridocautventas": fila.get("ciasridocautventas") or "",
                        "ciasrinotdebventas": fila.get("ciasrinotdebventas") or "",
                        "ciasrinotcreventas": fila.get("ciasrinotcreventas") or "",
                        "ciasriretfueventas": fila.get("ciasriretfueventas") or "",
                        "ciacodlocmatriz": fila.get("ciacodlocmatriz") or "",
                        "generacodian": fila.get("generacodian") or "",
                        "coscodigo": fila.get("coscodigo") or "",
                        "aplitransing": fila.get("aplitransing"),
                        "apliserie": fila.get("apliserie"),
                        "codclisec": fila.get("codclisec"),
                        "codprosec": fila.get("codprosec"),
                        "ciasecuencliente": fila.get("ciasecuencliente"),
                        "ciasecuenproveedor": fila.get("ciasecuenproveedor"),
                        "ciasecuentarjeta": fila.get("ciasecuentarjeta") or "",
                        "codartsec": fila.get("codartsec"),
                        "ciasecuenartventa": fila.get("ciasecuenartventa"),
                        "ciasecuenarticulo": fila.get("ciasecuenarticulo"),
                        "ciaactualizaprecios": fila.get("ciaactualizaprecios"),
                        "cianumresolucion": fila.get("cianumresolucion") or "",
                        "ciafecresolucion": fila.get("ciafecresolucion") or "",
                        "CiaNivelOrg": fila.get("CiaNivelOrg") or "",
                        "ciafororg": fila.get("ciafororg") or "",
                        "cianumvend": fila.get("cianumvend") or "",
                        "ciasolautfactcxp": fila.get("ciasolautfactcxp"),
                        "ciaaproautfactcxp": fila.get("ciaaproautfactcxp"),
                        "ciasolautanticxp": fila.get("ciasolautanticxp"),
                        "ciaaproautanticxp": fila.get("ciaaproautanticxp"),
                        "ciasolautpagocxp": fila.get("ciasolautpagocxp"),
                        "ciaaproautpagocxp": fila.get("ciaaproautpagocxp"),
                        "ciaaaocimport": fila.get("ciaaaocimport"),
                        "ciaaaocserv": fila.get("ciaaaocserv"),
                        "ciaaaocgasta": fila.get("ciaaaocgasta"),
                        "ciaaaoclocal": fila.get("ciaaaoclocal"),
                        "ciaaaocgastasoc": fila.get("ciaaaocgastasoc"),
                        "ciafacitemrep": fila.get("ciafacitemrep"),
                        "ciasecuenemple": fila.get("ciasecuenemple"),
                        "ciasecuencargo": fila.get("ciasecuencargo"),
                        "ciavalprecost": fila.get("ciavalprecost"),
                        "ciaporretiva": fila.get("ciaporretiva"),
                        "ciaporretfuente": fila.get("ciaporretfuente"),
                        "ciactapagolote": fila.get("ciactapagolote") or "",
                        "ciatipoocfaclote": fila.get("ciatipoocfaclote") or "",
                        "ciaivaservicio": fila.get("ciaivaservicio") or "",
                        "ciafacelectronica": fila.get("ciafacelectronica") or "",
                        "versionfac": fila.get("versionfac") or "",
                        "ciapdfelectronica": fila.get("ciapdfelectronica") or "",
                        "versionpdf": fila.get("versionpdf") or "",
                        "ciaambienteelectronica": fila.get("ciaambienteelectronica"),
                        "srimicroempresa": fila.get("srimicroempresa"),
                        "sricartera": fila.get("sricartera"),
                        "sriguia": fila.get("sriguia"),
                        "sriagenteretencion": fila.get("sriagenteretencion"),
                        "sriagenteretencionnumres": fila.get("sriagenteretencionnumres") or "",
                        "sricorreoffice": fila.get("sricorreoffice"),
                        "sricopiacorreo": fila.get("sricopiacorreo"),
                        "srimensajefactura": fila.get("srimensajefactura"),
                        "srissltls": fila.get("srissltls"),
                        "srioffini": fila.get("srioffini") or "",
                        "sriofffin": fila.get("sriofffin") or "",
                        "ciaaaocliqcomloc": fila.get("ciaaaocliqcomloc"),
                        "ciaaaocliqcomimp": fila.get("ciaaaocliqcomimp"),
                        "ciaaaocliqcomser": fila.get("ciaaaocliqcomser"),
                        "ciaaaocppe": fila.get("ciaaaocppe"),
                        "ciacobrapuntos": fila.get("ciacobrapuntos"),
                        "ciacobracupos": fila.get("ciacobracupos"),
                        "ciacobrafundacion": fila.get("ciacobrafundacion"),
                        "ciancbeneficiario": fila.get("ciancbeneficiario"),
                        "ciainmobiliaria": fila.get("ciainmobiliaria"),
                        "ciancdevcxccia": fila.get("ciancdevcxccia"),
                        "ciadiasretencion": fila.get("ciadiasretencion"),
                        "ciadiasemitirretencion": fila.get("ciadiasemitirretencion"),
                        "ciapropina": fila.get("ciapropina"),
                        "ciacontabilidad": fila.get("ciacontabilidad"),
                        "ciaetiquetaadiret": fila.get("ciaetiquetaadiret") or "",
                        "ciavaloradiret": fila.get("ciavaloradiret") or "",
                        "ciasolautclcxp": fila.get("ciasolautclcxp"),
                        "ciaaproautclcxp": fila.get("ciaaproautclcxp"),
                        "cialogo": fila.get("cialogo"),
                        "ciaselloagua": fila.get("ciaselloagua"),
                        "ciaivaporproducto": fila.get("ciaivaporproducto"),
                        "ciafacDeVariosLoc": fila.get("ciafacDeVariosLoc"),
                        "cialistprecdefweb": fila.get("cialistprecdefweb"),
                        "ciavalidaemp": fila.get("ciavalidaemp"),
                        "ciabasepuntos": fila.get("ciabasepuntos"),
                    }
                )

            insert_sql = text(
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

            connection.execute(insert_sql, to_insert)

    return {"data": "Compañías insertadas exitosamente", "inserted": len(to_insert)}
