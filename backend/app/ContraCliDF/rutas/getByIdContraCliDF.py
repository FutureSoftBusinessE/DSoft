from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.ContraCliDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/getByIdContraCliDF", methods=["POST"])
@jwt_required()
@api_endpoint
def getByIdContraCliDF():
    # 1. Extracción de sesión y contexto (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]

    data = request.get_json()
    concodcontrato = data.get("concodcontrato")

    if not concodcontrato:
        raise ValidationError("Debe proporcionar el código de contrato para la consulta.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # ---------------------------------------------------------
        # 2. CONSULTA DE CABECERA (JOIN con Clientes y Tipos)
        # ---------------------------------------------------------
        query_cab = text(
            """
            SELECT
                c.concodcontrato, c.condescri, c.clicodigo, c.clicodigoFac, cl.clinombre,
                c.concodigo, tc.condescri AS tipcondescri, c.constatus,
                CONVERT(varchar, c.confecinicio, 23) AS confecinicio,
                CONVERT(varchar, c.confecfin, 23) AS confecfin,
                CONVERT(varchar, c.confecfirma, 23) AS confecfirma,
                CONVERT(varchar, c.confecinifac, 23) AS confecinifac,
                c.confrecuencia, c.convalor
            FROM cxcccontratos c
            INNER JOIN cxcmcli cl ON c.ciacodigo = cl.ciacodigo AND c.clicodigo = cl.clicodigo
            INNER JOIN cxcbtipcon tc ON c.ciacodigo = tc.ciacodigo AND c.concodigo = tc.concodigo
            WHERE c.ciacodigo = :cia AND c.concodcontrato = :contrato
        """
        )
        cab_res = connection.execute(query_cab, {"cia": sCodCia, "contrato": concodcontrato}).mappings().fetchone()
        if not cab_res:
            raise ValidationError(f"No se encontró el contrato '{concodcontrato}'.")

        # Convertimos el objeto Row a un diccionario para el retorno
        contrato_data = dict(cab_res)
        contrato_data["convalor"] = float(contrato_data["convalor"] or 0.0)

        # ---------------------------------------------------------
        # 3. CONSULTA DE DETALLE DE SERVICIOS
        # ---------------------------------------------------------
        query_det = text(
            """
            SELECT
                consecuen, invcodigo, artcodigo, artdescri,
                concantidad, convalor, contotal
            FROM cxctcontratos
            WHERE ciacodigo = :cia AND concodcontrato = :contrato
            ORDER BY consecuen
        """
        )
        det_res = connection.execute(query_det, {"cia": sCodCia, "contrato": concodcontrato}).mappings().fetchall()
        servicios_list = []
        for row in det_res:
            item = dict(row)
            item["convalor"] = float(item["convalor"] or 0.0)
            item["contotal"] = float(item["contotal"] or 0.0)
            servicios_list.append(item)
        contrato_data["servicios"] = servicios_list
        # ---------------------------------------------------------
        # 4. CONSULTA DE PERÍODOS (Con cruce a Facturación)
        # ---------------------------------------------------------
        query_per = text(
            """
            SELECT
                p.consecuen, p.conmes, p.conanio, p.constatus, p.facnumfac,
                f.facfecemi, f.factotal, f.facsaldo
            FROM cxctcontratosperiodos p
            LEFT JOIN facfac f ON p.ciacodigo = f.ciacodigo AND p.facnumfac = f.facnumfac
            WHERE p.ciacodigo = :cia AND p.concodcontrato = :contrato
            ORDER BY p.consecuen
        """
        )
        per_res = connection.execute(query_per, {"cia": sCodCia, "contrato": concodcontrato}).mappings().fetchall()
        periodos_list = []
        for row in per_res:
            per = dict(row)
            # Formateo de fecha y montos de factura si existe
            if per.get("facfecemi"):
                per["facfecemi"] = per["facfecemi"].strftime("%Y-%m-%d")
            per["factotal"] = float(per["factotal"] or 0.0)
            per["facsaldo"] = float(per["facsaldo"] or 0.0)
            periodos_list.append(per)
        contrato_data["periodos"] = periodos_list

    # 5. Retorno estructurado para el estado del formulario en React
    return {"data": contrato_data}
