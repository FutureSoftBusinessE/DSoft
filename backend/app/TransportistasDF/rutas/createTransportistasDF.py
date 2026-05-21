from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TransportistasDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/createTransportistasDF", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def createTransportistasDF():
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

    # 3. Extracción de campos según estructura de tabla inbtranspor y diseño visual
    transcodigo = data.get("transcodigo")
    transdescri = data.get("transdescri")
    transdirec = data.get("transdirec")
    transruc = data.get("transruc")
    transtelef1 = data.get("transtelef1")
    transtipo = data.get("transtipo", "L")
    transstatus = data.get("transstatus", "A")
    transcuenta = data.get("transcuenta")

    # Sección de Contacto
    transcontactonombre = data.get("transcontactonombre")
    transcontactodirec = data.get("transcontactodirec")
    transcontactoemail = data.get("transcontactoemail")
    transcontactotelef = data.get("transcontactotelef")

    # Guía de Remisión
    transplaca = data.get("transplaca")

    # 4. Validaciones de campos obligatorios para la Clave Primaria
    if not transcodigo or str(transcodigo).strip() == "":
        raise ValidationError("El Código del Transportista es requerido")
    if not transdescri or str(transdescri).strip() == "":
        raise ValidationError("El Nombre del Transportista es requerido")
    if not transruc or str(transruc).strip() == "":
        raise ValidationError("El número de Cédula o R.U.C. es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Formateo y truncado según estructura de tabla varchar
            transcodigo = str(transcodigo).strip().upper()[:3]
            transdescri = str(transdescri).strip().upper()[:100]
            transdirec = str(transdirec).strip().upper()[:100]
            transruc = str(transruc).strip()[:20]

            # 5. Verificación de Duplicados (PK: ciacodigo + transcodigo)
            check_data = {
                "ciacodigo": sCodCia,
                "transcodigo": transcodigo
            }
            check_query = text("""
                SELECT transcodigo
                FROM inbtranspor
                WHERE ciacodigo = :ciacodigo
                  AND transcodigo = :transcodigo
            """)
            result = connection.execute(check_query, check_data).mappings().fetchone()

            if result:
                raise ValidationError(f"Ya existe un Transportista registrado con el código '{transcodigo}'")

            # 6. Preparación del Insert con Auditoría Completa
            data_insert = {
                "ciacodigo": sCodCia,
                "transcodigo": transcodigo,
                "transdescri": transdescri,
                "transdirec": transdirec,
                "transruc": transruc,
                "transtelef1": str(transtelef1)[:15] if transtelef1 else None,
                "transstatus": str(transstatus).strip().upper()[:1],
                "transtipo": str(transtipo).strip().upper()[:1],
                "transcuenta": str(transcuenta)[:20] if transcuenta else None,

                # Contacto
                "transcontacto": str(transcontactonombre).strip().upper()[:100] if transcontactonombre else None,
                "transcontactonombre": str(transcontactonombre).strip().upper()[:100] if transcontactonombre else None,
                "transcontactodirec": str(transcontactodirec).strip().upper()[:100] if transcontactodirec else None,
                "transcontactoemail": str(transcontactoemail).strip().lower()[:100] if transcontactoemail else None,
                "transcontactotelef": str(transcontactotelef)[:20] if transcontactotelef else None,

                # Placa
                "transplaca": str(transplaca).strip().upper()[:10] if transplaca else None,

                # Auditoría de Inserción
                "transfecisys": fecha_pura,
                "transhorisys": hora_pura,
                "transusuisys": sUsuario[:10],

                # Auditoría de Modificación
                "transfecmsys": fecha_pura,
                "transhormsys": hora_pura,
                "transusumsys": sUsuario[:10],
            }

            insert_query = text(
                """
                INSERT INTO inbtranspor (
                    ciacodigo, transcodigo, transdescri, transdirec, transruc, transtelef1,
                    transstatus, transtipo, transcuenta, transcontacto,
                    transcontactonombre, transcontactodirec, transcontactoemail, transcontactotelef,
                    transplaca, transfecisys, transhorisys, transusuisys,
                    transfecmsys, transhormsys, transusumsys
                ) VALUES (
                    :ciacodigo, :transcodigo, :transdescri, :transdirec, :transruc, :transtelef1,
                    :transstatus, :transtipo, :transcuenta, :transcontacto,
                    :transcontactonombre, :transcontactodirec, :transcontactoemail, :transcontactotelef,
                    :transplaca, :transfecisys, :transhorisys, :transusuisys,
                    :transfecmsys, :transhormsys, :transusumsys
                )
            """
            )

            connection.execute(insert_query, data_insert)

    return {"data": "Transportista creado exitosamente"}
