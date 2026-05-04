from flask import jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text

from app.TiposCliente import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError


@bp.route("/getTiposClienteByCodigo", methods=["POST"])
@cross_origin()
@jwt_required()
def getTiposClienteByCodigo():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]

    data = request.get_json() or {}
    clicodigo = str(data.get("clicodigo") or "").strip()

    if not clicodigo:
        raise ValidationError("clicodigo es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # 1. SELECT cliente principal (cxcmcli)
        query = text(
            """
            SELECT *
            FROM cxcmcli
            WHERE ciacodigo = :ciacodigo
              AND clicodigo = :clicodigo
            """
        )
        row = connection.execute(query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchone()

        if not row:
            raise ValidationError(f"No se encontró el registro ({sCodCia}, {clicodigo})")

        result = dict(row)

        # 2. SELECT Descuentos por Línea (cxcbclidesc) - Igual que VB CargaReg
        desc_linea_query = text(
            """
            SELECT a.lincodigo, b.lindescri,
                   CASE WHEN b.lintipo = 'M' THEN 'MAYOR' ELSE 'TRANSACCIONAL' END AS lintipo,
                   a.marcodigo, c.mardescri, a.desporcentaje, a.deslistaprecio
            FROM cxcbclidesc a
            LEFT JOIN inblin b ON a.ciacodigo = b.ciacodigo AND a.lincodigo = b.lincodigo
            LEFT JOIN inbmar c ON a.ciacodigo = c.ciacodigo AND a.marcodigo = c.marcodigo
            WHERE a.ciacodigo = :ciacodigo AND a.clicodigo = :clicodigo
            ORDER BY a.lincodigo
            """
        )
        desc_linea_rows = connection.execute(desc_linea_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["descuentosLineas"] = [
            {
                "linea": row.get("lincodigo") or "",
                "descripcionLinea": row.get("lindescri") or "",
                "tipo": row.get("lintipo") or "",
                "marca": row.get("marcodigo") or "",
                "descripcionMarca": row.get("mardescri") or "",
                "porcentaje": row.get("desporcentaje") or 0,
                "listaPrecios": str(row.get("deslistaprecio") or ""),
            }
            for row in desc_linea_rows
        ]

        # 3. SELECT Descuentos por Artículo (cxcbclidescart) - Igual que VB CargaReg
        desc_articulo_query = text(
            """
            SELECT a.artcodigo, b.artdescri, a.desporcentaje, a.deslistaprecio, a.invcodigo
            FROM cxcbclidescart a
            LEFT JOIN inmart b ON a.ciacodigo = b.ciacodigo AND a.invcodigo = b.invcodigo AND a.artcodigo = b.artcodigo
            WHERE a.ciacodigo = :ciacodigo AND a.clicodigo = :clicodigo
            ORDER BY a.artcodigo
            """
        )
        desc_articulo_rows = connection.execute(desc_articulo_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["descuentosArticulos"] = [
            {
                "articulo": row.get("artcodigo") or "",
                "descripcion": row.get("artdescri") or "",
                "porcentaje": row.get("desporcentaje") or 0,
                "listaPrecios": str(row.get("deslistaprecio") or ""),
                "invcodigo": row.get("invcodigo") or "",
            }
            for row in desc_articulo_rows
        ]

        # 4. SELECT Agencias (cxctcliagencias) - Igual que VB CargaReg
        agencias_query = text(
            """
            SELECT agencodigo, agendescri, agendirec, agentelpref1, agentelef1, agentelext1,
                   agentelpref2, agentelef2, agentelext2, agenemail, agecodrelext,
                   regcodigo, zoncodigo, procodigo, ciucodigo
            FROM cxctcliagencias
            WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            ORDER BY agencodigo
            """
        )
        agencias_rows = connection.execute(agencias_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["agencias"] = [
            {
                "codigo": row.get("agencodigo") or "",
                "descripcion": row.get("agendescri") or "",
                "direccion": row.get("agendirec") or "",
                "telPref1": row.get("agentelpref1") or "",
                "telefono1": row.get("agentelef1") or "",
                "ext1": row.get("agentelext1") or "",
                "telPref2": row.get("agentelpref2") or "",
                "telefono2": row.get("agentelef2") or "",
                "ext2": row.get("agentelext2") or "",
                "email": row.get("agenemail") or "",
                "codigoExterno": row.get("agecodrelext") or "",
                "region": row.get("regcodigo") or "",
                "zona": row.get("zoncodigo") or "",
                "provincia": row.get("procodigo") or "",
                "ciudad": row.get("ciucodigo") or "",
            }
            for row in agencias_rows
        ]

        # 5. SELECT Contactos (cxctclicontactos) - Igual que VB CargaReg
        contactos_query = text(
            """
            SELECT agencodigo, condescri, concargo, contelef1, contelef2, concelular, conemail,
                   areadescri, concomenta, contelpref1, contelext1, contelpref2, contelext2,
                   concodrelext, convalviaje
            FROM cxctclicontactos
            WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            ORDER BY agencodigo, condescri
            """
        )
        contactos_rows = connection.execute(contactos_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["contactos"] = [
            {
                "agencodigo": row.get("agencodigo") or "",
                "contacto": row.get("condescri") or "",
                "cargo": row.get("concargo") or "",
                "telPref1": row.get("contelpref1") or "",
                "telefono1": row.get("contelef1") or "",
                "ext1": row.get("contelext1") or "",
                "telPref2": row.get("contelpref2") or "",
                "telefono2": row.get("contelef2") or "",
                "ext2": row.get("contelext2") or "",
                "celular": row.get("concelular") or "",
                "email": row.get("conemail") or "",
                "area": row.get("areadescri") or "",
                "comentario": row.get("concomenta") or "",
                "externo": row.get("concodrelext") or "",
                "valViaje": row.get("convalviaje") or 0,
            }
            for row in contactos_rows
        ]

        # 6. SELECT Vendedores por Localidad (cxctcliven)
        vendedores_query = text(
            """
            SELECT a.vencodigo AS codigo, b.vennombre AS nombre, a.loccodigo AS codLocalidad, c.locdescri AS descLocalidad
            FROM cxctcliven a
            LEFT JOIN fapvendedor b ON a.ciacodigo = b.ciacodigo AND a.vencodigo = b.vencodigo
            LEFT JOIN cgblocal c ON a.ciacodigo = c.ciacodigo AND a.loccodigo = c.loccodigo
            WHERE a.ciacodigo = :ciacodigo AND a.clicodigo = :clicodigo
            ORDER BY a.vencodigo, a.loccodigo
            """
        )
        vendedores_rows = connection.execute(vendedores_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["vendedores"] = [
            {
                "codigo": row.get("codigo") or "",
                "nombre": row.get("nombre") or "",
                "codLocalidad": row.get("codLocalidad") or "",
                "descLocalidad": row.get("descLocalidad") or "",
                "vencodigo": row.get("codigo") or "",
                "vennombre": row.get("nombre") or "",
                "loccodigo": row.get("codLocalidad") or "",
                "locdescri": row.get("descLocalidad") or "",
                "local": row.get("codLocalidad") or "",
            }
            for row in vendedores_rows
        ]

        # 7. SELECT Referencias Bancarias (cxctclireferencias)
        referencias_query = text(
            """
            SELECT a.bcotipo AS tipoCuenta, a.bcocodigo AS codigo,
                   CASE
                       WHEN a.bcotipo = 'TARJETA' THEN (SELECT TOP 1 tarjdescri FROM cxcbtarj b WHERE a.ciacodigo = b.ciacodigo AND a.bcocodigo = b.tarjcodigo)
                       ELSE (SELECT TOP 1 bcodescri FROM cxcbbco c WHERE a.ciacodigo = c.ciacodigo AND a.bcocodigo = c.bcocodigo)
                   END AS descripcion,
                   a.bconumcta AS numero,
                   a.boccalifi AS calificacion,
                   a.bcofecape AS fechaApertura
            FROM cxctclireferencias a
            WHERE a.ciacodigo = :ciacodigo AND a.clicodigo = :clicodigo
            ORDER BY a.bcotipo, a.bcocodigo
            """
        )
        referencias_rows = connection.execute(referencias_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["refBancarias"] = [
            {
                "tipoCuenta": row.get("tipoCuenta") or "",
                "codigo": row.get("codigo") or "",
                "descripcion": row.get("descripcion") or "",
                "banco": row.get("descripcion") or row.get("codigo") or "",
                "numero": row.get("numero") or "",
                "calificacion": row.get("calificacion") or "",
                "fechaApertura": (row.get("fechaApertura").strftime("%Y-%m-%d") if hasattr(row.get("fechaApertura"), "strftime") else (row.get("fechaApertura") or "")),
            }
            for row in referencias_rows
        ]

        # 8. SELECT Historial del Cliente (cxctclihistorial)
        historial_query = text(
            """
            SELECT obssecuen, obsobserva, obsestisys, obsfecisys, obshorisys, obsusuisys
            FROM cxctclihistorial
            WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            ORDER BY obsfecisys DESC, obshorisys DESC
            """
        )
        historial_rows = connection.execute(historial_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["historial"] = [
            {
                "secuencia": row.get("obssecuen") or "",
                "observacion": row.get("obsobserva") or "",
                "estacion": row.get("obsestisys") or "",
                "fecha": row.get("obsfecisys") or "",
                "hora": row.get("obshorisys") or "",
                "usuario": row.get("obsusuisys") or "",
                "fechaRaw": row.get("obsfecisys") or "",
                "horaRaw": row.get("obshorisys") or "",
            }
            for row in historial_rows
        ]

        # 9. SELECT Auditoría de Modificaciones (cxchmcli)
        audit_query = text(
            """
            SELECT cliaccion, cliusumsys, clifecmsys, clihormsys, clicodigo, clinombre, cliidentifica, cliruc, clidiascrs, climontocrs
            FROM cxchmcli
            WHERE ciacodigo = :ciacodigo AND clicodigo = :clicodigo
            ORDER BY clifecmsys DESC, clihormsys DESC
            """
        )
        audit_rows = connection.execute(audit_query, {"ciacodigo": sCodCia, "clicodigo": clicodigo}).mappings().fetchall()
        result["auditLog"] = [
            {
                "accion": row.get("cliaccion") or "",
                "usuario": row.get("cliusumsys") or "",
                "fecha": (row.get("clifecmsys").strftime("%Y-%m-%d") if hasattr(row.get("clifecmsys"), "strftime") else (row.get("clifecmsys") or "")),
                "hora": (row.get("clihormsys").strftime("%H:%M:%S") if hasattr(row.get("clihormsys"), "strftime") else (row.get("clihormsys") or "")),
                "codigoCliente": row.get("clicodigo") or "",
                "nombreCliente": row.get("clinombre") or "",
                "tipoIdentificacion": row.get("cliidentifica") or "",
                "numeroIdentificacion": row.get("cliruc") or "",
                "diasCredito": row.get("clidiascrs") or 0,
                "montoCredito": row.get("climontocrs") or 0,
                "cliaccion": row.get("cliaccion") or "",
                "cliusumsys": row.get("cliusumsys") or "",
                "clifecmsys": row.get("clifecmsys") or "",
                "clihormsys": row.get("clihormsys") or "",
                "clicodigo": row.get("clicodigo") or "",
                "clinombre": row.get("clinombre") or "",
                "cliidentifica": row.get("cliidentifica") or "",
                "cliruc": row.get("cliruc") or "",
                "clidiascrs": row.get("clidiascrs") or 0,
                "climontocrs": row.get("climontocrs") or 0,
            }
            for row in audit_rows
        ]

    return jsonify({"data": result})
