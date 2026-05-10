from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TiposCliente import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError

@bp.route("/createTiposCliente", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createTiposCliente():
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
    
    # 3. Extracción de campos según estructura de tabla cxcbtipcli
    tipcodigo = data.get("tipcodigo")
    tipdescri = data.get("tipdescri")
    tipcobdir = data.get("tipcobdir", 0)    # Cobro Directo (int)
    tipdefacr = data.get("tipdefacr", 0)    # Déficit/Acreedor (decimal)
    tipstatus = data.get("tipstatus", "A")

    # 4. Validaciones de campos obligatorios
    if not tipcodigo or str(tipcodigo).strip() == "":
        raise ValidationError("El Código del Tipo de Cliente es requerido")
    if not tipdescri or str(tipdescri).strip() == "":
        raise ValidationError("La descripción del Tipo de Cliente es requerida")

    db.session = get_session(clicianonBD)
    engine = db.session.bind
    
    with engine.connect() as connection:
        with connection.begin():
            # Formateo y truncado según estructura varchar(3) y varchar(40)
            tipcodigo = str(tipcodigo).strip().upper()[:3]
            tipdescri = str(tipdescri).strip().upper()[:40]
            
            # 5. Verificación de Duplicados (PK: ciacodigo + tipcodigo)
            check_data = {
                "ciacodigo": sCodCia,
                "tipcodigo": tipcodigo
            }
            check_query = text("""
                SELECT tipcodigo 
                FROM cxcbtipcli 
                WHERE ciacodigo = :ciacodigo 
                  AND tipcodigo = :tipcodigo
            """)
            result = connection.execute(check_query, check_data).mappings().fetchone()
            
            if result:
                raise ValidationError(f"Ya existe un Tipo de Cliente registrado con el código '{tipcodigo}'")

            # 6. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "tipcodigo": tipcodigo,
                "tipdescri": tipdescri,
                "tipcobdir": int(tipcobdir),
                "tipstatus": str(tipstatus).strip().upper()[:1],
                "tipdefacr": float(tipdefacr),
                
                # Auditoría de Inserción
                "tipfecisys": fecha_pura,
                "tiphorisys": hora_pura,
                "tipusuisys": sUsuario[:10], # varchar(10) en cxcbtipcli
                
                # Auditoría de Modificación
                "tipfecmsys": fecha_pura,
                "tiphormsys": hora_pura,
                "tipusumsys": sUsuario[:10], # varchar(10) en cxcbtipcli
            }

            insert_query = text(
                """
                INSERT INTO cxcbtipcli (
                    ciacodigo, tipcodigo, tipdescri, tipcobdir, tipstatus, tipdefacr,
                    tipfecisys, tiphorisys, tipusuisys,
                    tipfecmsys, tiphormsys, tipusumsys
                ) VALUES (
                    :ciacodigo, :tipcodigo, :tipdescri, :tipcobdir, :tipstatus, :tipdefacr,
                    :tipfecisys, :tiphorisys, :tipusuisys,
                    :tipfecmsys, :tiphormsys, :tipusumsys
                )
            """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Tipo de Cliente creado exitosamente"}