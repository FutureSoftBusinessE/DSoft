from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ContraCliDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/updateContraCliDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateContraCliDF():
    # 1. Extracción de sesión y contexto de auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]
    sUsuario = str(claims.get("user", "WEB")).strip()[:10]
    sNomEst = str(request.headers.get("X-Forwarded-For", request.remote_addr) or "WEB").strip()[:50]

    # 2. Lógica de separación de Fecha y Hora para auditoría en SQL Server
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    
    # 3. Extracción de la Cabecera (cxcccontratos)
    # concodcontrato es Intocable en el UPDATE, se usa para el WHERE
    concodcontrato = str(data.get("concodcontrato", "")).strip().upper()[:18]
    
    concodigo = str(data.get("concodigo", "")).strip().upper()[:3]
    condescri = str(data.get("condescri", "")).strip().upper()[:250]
    
    confecinicio = data.get("confecinicio")
    confecfin = data.get("confecfin")
    confecfirma = data.get("confecfirma")
    confecinifac = data.get("confecinifac")
    
    confrecuencia = str(data.get("confrecuencia", "MENSUAL")).strip().upper()[:10]
    convalor = float(data.get("convalor", 0.0))
    constatus = str(data.get("constatus", "A")).strip().upper()[:1]

    # Extracción de las Tablas Hijas
    servicios = data.get("servicios", [])
    periodos = data.get("periodos", [])

    # 4. Validaciones Estrictas
    if not concodcontrato:
        raise ValidationError("El Código de Contrato es requerido para la actualización.")
    if not concodigo:
        raise ValidationError("Debe seleccionar un Tipo de Contrato.")
    if not confecinicio or not confecfin:
        raise ValidationError("Las fechas de Inicio y Fin del contrato son obligatorias.")
    if not servicios or len(servicios) == 0:
        raise ValidationError("Debe ingresar al menos un Servicio para actualizar el Contrato.")
    if not periodos or len(periodos) == 0:
        raise ValidationError("Debe generar los períodos a facturar antes de actualizar.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # 5. Validación Regla de Negocio VB6: Verificar que exista y esté Activo
            check_exist = text("""
                SELECT constatus, confecfin 
                FROM cxcccontratos 
                WHERE ciacodigo = :ciacodigo AND concodcontrato = :concodcontrato
            """)
            exist = connection.execute(check_exist, {"ciacodigo": sCodCia, "concodcontrato": concodcontrato}).mappings().fetchone()
            
            if not exist:
                raise ValidationError(f"El Contrato '{concodcontrato}' no existe o pertenece a otra compañía.")
            if exist["constatus"] != "A":
                raise ValidationError("Estado de Contrato no permite modificarlo, verifique.")

            # 6. Validación Regla de Negocio VB6: No debe tener facturas emitidas (facfac)
            check_facturas = text("""
                SELECT facnumfac 
                FROM facfac 
                WHERE ciacodigo = :ciacodigo AND facnumref = :concodcontrato
            """)
            factura = connection.execute(check_facturas, {"ciacodigo": sCodCia, "concodcontrato": concodcontrato}).mappings().fetchone()
            
            if factura:
                raise ValidationError("No puede modificar el Contrato porque ya tiene Factura(s) emitida(s), verifique.")

            # ---------------------------------------------------------
            # 7. ACTUALIZACIÓN DE LA CABECERA (cxcccontratos)
            # ---------------------------------------------------------
            update_cabecera = text("""
                UPDATE cxcccontratos SET 
                    condescri = :condescri, 
                    concodigo = :concodigo,
                    constatus = :constatus, 
                    confecinicio = :confecinicio, 
                    confecfin = :confecfin, 
                    confecfirma = :confecfirma, 
                    confecinifac = :confecinifac,
                    confrecuencia = :confrecuencia, 
                    convalor = :convalor, 
                    confecmsys = :fecmsys, 
                    conhormsys = :hormsys, 
                    conusumsys = :usumsys, 
                    conestmsys = :estmsys
                WHERE ciacodigo = :ciacodigo AND concodcontrato = :concodcontrato
            """)
            
            connection.execute(update_cabecera, {
                "ciacodigo": sCodCia,
                "concodcontrato": concodcontrato,
                "condescri": condescri,
                "concodigo": concodigo,
                "constatus": constatus,
                "confecinicio": confecinicio,
                "confecfin": confecfin,
                "confecfirma": confecfirma,
                "confecinifac": confecinifac,
                "confrecuencia": confrecuencia,
                "convalor": convalor,
                "fecmsys": fecha_pura,
                "hormsys": hora_pura,
                "usumsys": sUsuario,
                "estmsys": sNomEst
            })

            # ---------------------------------------------------------
            # 8. ELIMINACIÓN DE DETALLE Y PERÍODOS (Delete & Re-Insert)
            # ---------------------------------------------------------
            delete_servicios = text("DELETE FROM cxctcontratos WHERE ciacodigo = :ciacodigo AND concodcontrato = :concodcontrato")
            connection.execute(delete_servicios, {"ciacodigo": sCodCia, "concodcontrato": concodcontrato})

            delete_periodos = text("DELETE FROM cxctcontratosperiodos WHERE ciacodigo = :ciacodigo AND concodcontrato = :concodcontrato")
            connection.execute(delete_periodos, {"ciacodigo": sCodCia, "concodcontrato": concodcontrato})

            # ---------------------------------------------------------
            # 9. RE-INSERCIÓN DEL DETALLE DE SERVICIOS (cxctcontratos)
            # ---------------------------------------------------------
            insert_detalle = text("""
                INSERT INTO cxctcontratos (
                    ciacodigo, concodcontrato, consecuen, constatus, invcodigo, 
                    artcodigo, artdescri, concantidad, convalor, contotal,
                    confecisys, conhorisys, conusuisys, conestisys, 
                    confecmsys, conhormsys, conusumsys, conestmsys
                ) VALUES (
                    :ciacodigo, :concodcontrato, :consecuen, 'A', :invcodigo,
                    :artcodigo, :artdescri, :concantidad, :convalor, :contotal,
                    :fecisys, :horisys, :usuisys, :estisys,
                    :fecmsys, :hormsys, :usumsys, :estmsys
                )
            """)
            
            for index, item in enumerate(servicios, start=1):
                connection.execute(insert_detalle, {
                    "ciacodigo": sCodCia,
                    "concodcontrato": concodcontrato,
                    "consecuen": index,
                    "invcodigo": str(item.get("invcodigo", "")).strip().upper()[:2],
                    "artcodigo": str(item.get("artcodigo", "")).strip().upper()[:15],
                    "artdescri": str(item.get("artdescri", "")).strip().upper()[:250],
                    "concantidad": int(item.get("concantidad", 1)),
                    "convalor": float(item.get("convalor", 0.0)),
                    "contotal": float(item.get("contotal", 0.0)),
                    "fecisys": fecha_pura,
                    "horisys": hora_pura,
                    "usuisys": sUsuario,
                    "estisys": sNomEst,
                    "fecmsys": fecha_pura,
                    "hormsys": hora_pura,
                    "usumsys": sUsuario,
                    "estmsys": sNomEst
                })

            # ---------------------------------------------------------
            # 10. RE-INSERCIÓN DE LOS PERÍODOS A FACTURAR (cxctcontratosperiodos)
            # ---------------------------------------------------------
            insert_periodos = text("""
                INSERT INTO cxctcontratosperiodos (
                    ciacodigo, concodcontrato, consecuen, conmes, conanio, constatus,
                    confecisys, conhorisys, conusuisys, conestisys, 
                    confecmsys, conhormsys, conusumsys, conestmsys
                ) VALUES (
                    :ciacodigo, :concodcontrato, :consecuen, :conmes, :conanio, :constatus,
                    :fecisys, :horisys, :usuisys, :estisys,
                    :fecmsys, :hormsys, :usumsys, :estmsys
                )
            """)
            
            for index, per in enumerate(periodos, start=1):
                connection.execute(insert_periodos, {
                    "ciacodigo": sCodCia,
                    "concodcontrato": concodcontrato,
                    "consecuen": index,
                    "conmes": int(per.get("conmes", 0)),
                    "conanio": int(per.get("conanio", 0)),
                    "constatus": str(per.get("constatus", "A")).strip().upper()[:1],
                    "fecisys": fecha_pura,
                    "horisys": hora_pura,
                    "usuisys": sUsuario,
                    "estisys": sNomEst,
                    "fecmsys": fecha_pura,
                    "hormsys": hora_pura,
                    "usumsys": sUsuario,
                    "estmsys": sNomEst
                })

    return {"data": "Contrato de Cliente actualizado exitosamente"}