from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.ProveedoresDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

def validar_identificacion_ec(tipo, valor):
    """Validador de longitud de identificación estándar SIAC"""
    if tipo == 'R': # R.U.C.
        if len(str(valor).strip()) != 13:
            raise ValidationError("El R.U.C. debe tener exactamente 13 dígitos")
    elif tipo == 'C': # Cédula
        if len(str(valor).strip()) != 10:
            raise ValidationError("La Cédula debe tener exactamente 10 dígitos")

@bp.route("/createProveedoresDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createProveedoresDF():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    
    # Extracción de campos
    procalif = data.get("procalif", "R")
    proruc = data.get("proruc")
    pronombre = data.get("pronombre")

    # 3. Validaciones de Identidad
    if not proruc:
        raise ValidationError("El número de Identificación es requerido")
    validar_identificacion_ec(procalif, proruc)

    if not pronombre or str(pronombre).strip() == "":
        raise ValidationError("El Nombre del Proveedor es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # 4. Lógica de Secuencia: Obtener -> Incrementar -> Usar
            sql_sec = text("SELECT secnumero FROM siacsec WHERE ciacodigo = :cia AND seccodigo = 'PRO'")
            res_sec = connection.execute(sql_sec, {"cia": sCodCia}).mappings().fetchone()
            
            if not res_sec:
                raise ValidationError("No se encontró la secuencia 'PRO' en siacsec para esta compañía.")
            
            # Incrementamos antes de usar
            nuevo_numero = int(res_sec["secnumero"]) + 1
            procodigo_gen = str(nuevo_numero).zfill(6)

            # 5. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "procodigo": procodigo_gen,
                "procalif": procalif,
                "proruc": str(proruc).strip(),
                "pronombre": str(pronombre).strip().upper()[:200],
                "pronommat": str(data.get("pronommat", pronombre)).strip().upper()[:200],
                "prorepres": str(data.get("prorepres", "")).strip().upper()[:40],
                "propais": "ECUADOR",
                "prociudad": "GUAYAQUIL",
                "prodirec": str(data.get("prodirec", "")).strip().upper()[:200],
                "proemail": str(data.get("proemail", "")).strip().lower()[:100],
                "protelef1": str(data.get("protelef1", "")).strip()[:15],
                "procelu": str(data.get("procelu", "")).strip()[:15],
                "prostatus": str(data.get("prostatus", "A")).strip().upper()[:1],
                "prosaldosuc": 0, "prosaldodol": 0, "proesperjur": 0, "proesconesp": 0,
                "procambiaimp": 0, "prodiacre": 0, "proparterel": "N", "procuo": 1,
                "protarcre": 0, "procuota": 0, "prodescuento": 0, "prolistaprecio": 1,
                "proaplicaGar": "0", "progardias": 0, "proaplicaContr": "0", "procontrdias": 0, "proaplicarebate": "0",
                "profecisys": fecha_pura, "prohorisys": hora_pura, "prousuisys": sUsuario[:10],
                "profecmsys": fecha_pura, "prohormsys": hora_pura, "prousumsys": sUsuario[:10],
            }

            insert_query = text("""
                INSERT INTO cxpmprov (
                    ciacodigo, procodigo, procalif, proruc, pronombre, pronommat, prorepres, propais, prociudad,
                    prodirec, proemail, protelef1, procelu, prostatus, prosaldosuc, prosaldodol,
                    proesperjur, proesconesp, procambiaimp, prodiacre, proparterel, procuo, protarcre, 
                    procuota, prodescuento, prolistaprecio, proaplicaGar, progardias, proaplicaContr, 
                    procontrdias, proaplicarebate, profecisys, prohorisys, prousuisys, profecmsys, prohormsys, prousumsys
                ) VALUES (
                    :ciacodigo, :procodigo, :procalif, :proruc, :pronombre, :pronommat, :prorepres, :propais, :prociudad,
                    :prodirec, :proemail, :protelef1, :procelu, :prostatus, :prosaldosuc, :prosaldodol,
                    :proesperjur, :proesconesp, :procambiaimp, :prodiacre, :proparterel, :procuo, :protarcre, 
                    :procuota, :prodescuento, :prolistaprecio, :proaplicaGar, :progardias, :proaplicaContr, 
                    :procontrdias, :proaplicarebate, :profecisys, :prohorisys, :prousuisys, :profecmsys, :prohormsys, :prousumsys
                )
            """)
            connection.execute(insert_query, data_insert)

            # 6. Actualizar Tabla de Secuencias con el nuevo número
            update_sec_sql = text("UPDATE siacsec SET secnumero = :nuevo WHERE ciacodigo = :cia AND seccodigo = 'PRO'")
            connection.execute(update_sec_sql, {"nuevo": nuevo_numero, "cia": sCodCia})

    return {"data": "Proveedor creado exitosamente", "procodigo": procodigo_gen}