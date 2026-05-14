from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ContraCliDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/createContraCliDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createContraCliDF():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]
    sUsuario = str(claims.get("user", "WEB")).strip()[:10]
    sNomEst = str(request.headers.get("X-Forwarded-For", request.remote_addr) or "WEB").strip()[:50]

    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')
    
    # Para el código nemotécnico necesitamos el año en 4 y 2 dígitos
    anio_actual = now.year
    anio_2_digitos = now.strftime('%y')

    data = request.get_json()
    
    # Datos de Cabecera
    clicodigo = str(data.get("clicodigo", "")).strip().upper()[:6]
    concodigo = str(data.get("concodigo", "")).strip().upper()[:3]
    condescri = str(data.get("condescri", "")).strip().upper()[:250]
    confecinicio = data.get("confecinicio")
    confecfin = data.get("confecfin")
    confecfirma = data.get("confecfirma")
    confecinifac = data.get("confecinifac")
    confrecuencia = str(data.get("confrecuencia", "MENSUAL")).strip().upper()[:10]
    convalor = float(data.get("convalor", 0.0))

    # Extracción de Tablas Hijas
    servicios = data.get("servicios", [])
    periodos = data.get("periodos", [])

    if not clicodigo or not concodigo:
        raise ValidationError("Cliente y Tipo de Contrato son obligatorios.")
    if len(servicios) == 0:
        raise ValidationError("Debe ingresar al menos un Servicio para generar el Contrato.")
    if len(periodos) == 0:
        raise ValidationError("Debe generar los períodos a facturar antes de guardar.")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # ---------------------------------------------------------
            # 1. GENERACIÓN DEL CÓDIGO NEMOTÉCNICO (cgpdpto)
            # ---------------------------------------------------------
            seq_query = text("""
                SELECT dptonumsec 
                FROM cgpdpto 
                WHERE ciacodigo = :cia AND dptoanio = :anio 
                  AND dptocodigo = 'CXC' AND doccodigo = 'CO'
            """)
            seq_res = connection.execute(seq_query, {"cia": sCodCia, "anio": anio_actual}).mappings().fetchone()
            
            if not seq_res:
                raise ValidationError(f"No existe una secuencia configurada en cgpdpto para el año {anio_actual} (CXC-CO).")
            
            nuevo_secuencial = int(seq_res["dptonumsec"]) + 1
            
            # Construcción estricta: doccodigo(CO) + locservidor(A) + dptoanio(26) + dptonumsec(000001) + localidad(01)
            doccodigo = "CO"
            locservidor = "A"
            localidad = "01" # Default según su requerimiento
            secuencia_formateada = str(nuevo_secuencial).zfill(6)
            
            concodcontrato = f"{doccodigo}{locservidor}{anio_2_digitos}{secuencia_formateada}{localidad}"

            # Validación de duplicidad por si acaso hubo un salto manual en la tabla
            check_exist = connection.execute(
                text("SELECT concodcontrato FROM cxcccontratos WHERE ciacodigo = :cia AND concodcontrato = :con"),
                {"cia": sCodCia, "con": concodcontrato}
            ).fetchone()
            if check_exist:
                raise ValidationError(f"Error de colisión: El contrato '{concodcontrato}' ya existe en la base de datos.")

            # ---------------------------------------------------------
            # 2. INSERCIÓN DE CABECERA (cxcccontratos)
            # ---------------------------------------------------------
            insert_cabecera = text("""
                INSERT INTO cxcccontratos (
                    ciacodigo, concodcontrato, condescri, clicodigo, concodigo,
                    constatus, confecinicio, confecfin, confecfirma, confecinifac,
                    confrecuencia, convalor, confecisys, conhorisys, conusuisys, 
                    conestisys, confecmsys, conhormsys, conusumsys, conestmsys
                ) VALUES (
                    :ciacodigo, :concodcontrato, :condescri, :clicodigo, :concodigo,
                    'A', :confecinicio, :confecfin, :confecfirma, :confecinifac,
                    :confrecuencia, :convalor, :fecisys, :horisys, :usuisys, 
                    :estisys, :fecmsys, :hormsys, :usumsys, :estmsys
                )
            """)
            
            connection.execute(insert_cabecera, {
                "ciacodigo": sCodCia, "concodcontrato": concodcontrato, "condescri": condescri,
                "clicodigo": clicodigo, "concodigo": concodigo, "confecinicio": confecinicio,
                "confecfin": confecfin, "confecfirma": confecfirma, "confecinifac": confecinifac,
                "confrecuencia": confrecuencia, "convalor": convalor, "fecisys": fecha_pura,
                "horisys": hora_pura, "usuisys": sUsuario, "estisys": sNomEst,
                "fecmsys": fecha_pura, "hormsys": hora_pura, "usumsys": sUsuario, "estmsys": sNomEst
            })

            # ---------------------------------------------------------
            # 3. ACTUALIZACIÓN DEL SECUENCIAL EN (cgpdpto)
            # ---------------------------------------------------------
            connection.execute(text("""
                UPDATE cgpdpto SET dptonumsec = :nuevo 
                WHERE ciacodigo = :cia AND dptoanio = :anio 
                  AND dptocodigo = 'CXC' AND doccodigo = 'CO'
            """), {"nuevo": nuevo_secuencial, "cia": sCodCia, "anio": anio_actual})

            # ---------------------------------------------------------
            # 4. INSERCIÓN DEL DETALLE DE SERVICIOS (cxctcontratos)
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
                    "fecisys": fecha_pura, "horisys": hora_pura,
                    "usuisys": sUsuario, "estisys": sNomEst,
                    "fecmsys": fecha_pura, "hormsys": hora_pura,
                    "usumsys": sUsuario, "estmsys": sNomEst
                })

            # ---------------------------------------------------------
            # 5. INSERCIÓN DE LOS PERÍODOS A FACTURAR (cxctcontratosperiodos)
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
                    "fecisys": fecha_pura, "horisys": hora_pura,
                    "usuisys": sUsuario, "estisys": sNomEst,
                    "fecmsys": fecha_pura, "hormsys": hora_pura,
                    "usumsys": sUsuario, "estmsys": sNomEst
                })

    # El frontend leerá este mensaje, ahora incluye el número dinámico generado
    return {"data": f"Contrato {concodcontrato} generado y guardado exitosamente."}