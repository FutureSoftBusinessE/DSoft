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
    if tipo == 'R':
        if len(str(valor).strip()) != 13:
            raise ValidationError("El R.U.C. debe tener exactamente 13 dígitos")
    elif tipo == 'C':
        if len(str(valor).strip()) != 10:
            raise ValidationError("La Cédula debe tener exactamente 10 dígitos")

@bp.route("/updateProveedoresDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def updateProveedoresDF():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    now = datetime.now()
    fecha_pura = now.strftime('%Y-%m-%d 00:00:00')
    hora_pura = now.strftime('1900-01-01 %H:%M:%S')

    data = request.get_json()
    procodigo = data.get("procodigo")
    procalif = data.get("procalif", "R")
    proruc = data.get("proruc")

    if not procodigo:
        raise ValidationError("El código del proveedor es requerido")
    
    # Validación de identidad en edición
    validar_identificacion_ec(procalif, proruc)

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            data_update = {
                "ciacodigo": sCodCia,
                "procodigo": str(procodigo).strip(),
                "procalif": procalif,
                "proruc": str(proruc).strip(),
                "pronombre": str(data.get("pronombre")).strip().upper()[:200],
                "pronommat": str(data.get("pronommat")).strip().upper()[:200],
                "prodirec": str(data.get("prodirec")).strip().upper()[:200],
                "proemail": str(data.get("proemail")).strip().lower()[:100],
                "protelef1": str(data.get("protelef1")).strip()[:15],
                "procelu": str(data.get("procelu")).strip()[:15],
                "prostatus": str(data.get("prostatus")).strip().upper()[:1],
                "profecmsys": fecha_pura,
                "prohormsys": hora_pura,
                "prousumsys": sUsuario[:10],
            }

            update_query = text("""
                UPDATE cxpmprov SET
                    procalif = :procalif,
                    proruc = :proruc,
                    pronombre = :pronombre,
                    pronommat = :pronommat,
                    prodirec = :prodirec,
                    proemail = :proemail,
                    protelef1 = :protelef1,
                    procelu = :procelu,
                    prostatus = :prostatus,
                    profecmsys = :profecmsys,
                    prohormsys = :prohormsys,
                    prousumsys = :prousumsys
                WHERE ciacodigo = :ciacodigo AND procodigo = :procodigo
            """)
            connection.execute(update_query, data_update)

    return {"data": "Proveedor actualizado exitosamente"}