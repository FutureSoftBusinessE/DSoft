from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.TransportistasDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint, ValidationError


@bp.route("/updateTransportistasDF", methods=["POST"])
@jwt_required()
@api_endpoint
def updateTransportistasDF():
    # 1. Extracción de sesión y contexto de auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora para auditoría en SQL Server
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()

    # Identificadores de la Clave Primaria (Old para localizar, New por si se edita el código)
    transcodigo_old = data.get("transcodigoOld", data.get("transcodigo"))
    transcodigo_new = data.get("transcodigoNew", data.get("transcodigo"))

    # Campos a actualizar según estructura de la tabla inbtranspor
    transdescri = data.get("transdescri")
    transdirec = data.get("transdirec")
    transruc = data.get("transruc")
    transtelef1 = data.get("transtelef1")
    transstatus = data.get("transstatus", "A")
    transtipo = data.get("transtipo", "L")
    transcuenta = data.get("transcuenta")
    transcontactonombre = data.get("transcontactonombre")
    transcontactodirec = data.get("transcontactodirec")
    transcontactoemail = data.get("transcontactoemail")
    transcontactotelef = data.get("transcontactotelef")
    transplaca = data.get("transplaca")

    # 3. Validaciones de integridad
    if not transcodigo_old or not transcodigo_new:
        raise ValidationError("El código del transportista es requerido")
    if not transdescri:
        raise ValidationError("El nombre o descripción del transportista es requerido")
    if not transruc:
        raise ValidationError("El número de Cédula/R.U.C. es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # 4. Preparación de parámetros con limpieza y truncado técnico según inbtranspor
            data_update = {
                "ciacodigo": sCodCia,
                "transcodigoOld": str(transcodigo_old).strip().upper()[:3],
                "transcodigoNew": str(transcodigo_new).strip().upper()[:3],
                "transdescri": str(transdescri).strip().upper()[:100],
                "transdirec": str(transdirec).strip().upper()[:100],
                "transruc": str(transruc).strip().upper()[:20],
                "transtelef1": str(transtelef1).strip()[:15] if transtelef1 else None,
                "transstatus": str(transstatus).strip().upper()[:1],
                "transtipo": str(transtipo).strip().upper()[:1],
                "transcuenta": str(transcuenta).strip().upper()[:20] if transcuenta else None,
                # Campos de contacto
                "transcontacto": str(transcontactonombre).strip().upper()[:100] if transcontactonombre else None,
                "transcontactonombre": str(transcontactonombre).strip().upper()[:100] if transcontactonombre else None,
                "transcontactodirec": str(transcontactodirec).strip().upper()[:100] if transcontactodirec else None,
                "transcontactoemail": str(transcontactoemail).strip().lower()[:100] if transcontactoemail else None,
                "transcontactotelef": str(transcontactotelef).strip()[:20] if transcontactotelef else None,
                "transplaca": str(transplaca).strip().upper()[:10] if transplaca else None,
                # Auditoría de Modificación (msys)
                "transfecmsys": fecha_pura,
                "transhormsys": hora_pura,
                "transusumsys": sUsuario[:10],
            }

            # 5. Sentencia SQL de actualización respetando la Clave Primaria Compuesta
            update_query = text(
                """
                UPDATE inbtranspor SET
                    transcodigo = :transcodigoNew,
                    transdescri = :transdescri,
                    transdirec = :transdirec,
                    transruc = :transruc,
                    transtelef1 = :transtelef1,
                    transstatus = :transstatus,
                    transtipo = :transtipo,
                    transcuenta = :transcuenta,
                    transcontacto = :transcontacto,
                    transcontactonombre = :transcontactonombre,
                    transcontactodirec = :transcontactodirec,
                    transcontactoemail = :transcontactoemail,
                    transcontactotelef = :transcontactotelef,
                    transplaca = :transplaca,
                    transfecmsys = :transfecmsys,
                    transhormsys = :transhormsys,
                    transusumsys = :transusumsys
                WHERE ciacodigo = :ciacodigo
                  AND transcodigo = :transcodigoOld
            """
            )

            try:
                # 6. Ejecución con captura de errores de integridad
                connection.execute(update_query, data_update)
            except IntegrityError:
                raise ValidationError("No se puede actualizar el Transportista. Verifique que el nuevo código no exista ya o que no tenga registros vinculados en el sistema.")

    return {"data": "Transportista actualizado exitosamente"}
