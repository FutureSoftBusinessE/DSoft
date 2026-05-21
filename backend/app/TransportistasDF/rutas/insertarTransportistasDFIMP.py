from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from datetime import datetime

from app.TransportistasDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint

# Importamos la función de validación del módulo Transportistas
from app.TransportistasDF.rutas.validarTransportistasDFIMP import validar_transportistasdf


@bp.route("/insertarTransportistasDFIMP", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def insertarTransportistasDFIMP():
    # 1. Extracción de contexto y auditoría (Estándar SIAC)
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # 2. Lógica de separación de Fecha y Hora pura para SQL Server
    now = datetime.now()
    fecha_pura = now.strftime("%Y-%m-%d 00:00:00")
    hora_pura = now.strftime("1900-01-01 %H:%M:%S")

    data = request.get_json()
    columns = data.get("columns")
    required = data.get("required")
    key_columns = data.get("key_columns")
    rows_csv = data.get("rows")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    # Inyectamos la compañía antes de validar para el cumplimiento Multitenancy
    for fila in rows_csv:
        if isinstance(fila, dict):
            fila["ciacodigo"] = sCodCia

    with engine.connect() as connection:
        with connection.begin():
            # 3. Validación previa a la inserción
            rows, summary = validar_transportistasdf(connection, columns, required, key_columns, rows_csv)

            # Si existen registros inválidos, frenamos el proceso y devolvemos el feedback
            if summary["invalid_rows"] > 0:
                return {
                    "data": "No se realizó la importación: existen errores de validación",
                    "rows": rows,
                    "summary": summary,
                    "inserted": 0,
                }

            # 4. Preparación del lote para inserción masiva en la tabla inbtranspor
            to_insert = []
            for fila in rows:
                to_insert.append(
                    {
                        "ciacodigo": sCodCia,
                        "transcodigo": str(fila.get("transcodigo", "")).strip().upper()[:3],
                        "transdescri": str(fila.get("transdescri", "")).strip().upper()[:100],
                        "transdirec": str(fila.get("transdirec", "")).strip().upper()[:100],
                        "transruc": str(fila.get("transruc", "")).strip().upper()[:20],
                        "transtelef1": str(fila.get("transtelef1", ""))[:15] if fila.get("transtelef1") else None,
                        "transstatus": str(fila.get("transstatus", "A")).strip().upper()[:1],
                        "transtipo": str(fila.get("transtipo", "L")).strip().upper()[:1],
                        "transcuenta": str(fila.get("transcuenta", ""))[:20] if fila.get("transcuenta") else None,
                        # Datos de Contacto
                        "transcontacto": str(fila.get("transcontactonombre", "")).strip().upper()[:100] if fila.get("transcontactonombre") else None,
                        "transcontactonombre": str(fila.get("transcontactonombre", "")).strip().upper()[:100] if fila.get("transcontactonombre") else None,
                        "transcontactodirec": str(fila.get("transcontactodirec", "")).strip().upper()[:100] if fila.get("transcontactodirec") else None,
                        "transcontactoemail": str(fila.get("transcontactoemail", "")).strip().lower()[:100] if fila.get("transcontactoemail") else None,
                        "transcontactotelef": str(fila.get("transcontactotelef", ""))[:20] if fila.get("transcontactotelef") else None,
                        # Placa
                        "transplaca": str(fila.get("transplaca", "")).strip().upper()[:10] if fila.get("transplaca") else None,
                        # Auditoría de Inserción
                        "transfecisys": fecha_pura,
                        "transhorisys": hora_pura,
                        "transusuisys": sUsuario[:10],
                        # Auditoría de Modificación
                        "transfecmsys": fecha_pura,
                        "transhormsys": hora_pura,
                        "transusumsys": sUsuario[:10],
                    }
                )

            # 5. Ejecución del INSERT masivo en SQL Server
            insert_sql = text(
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

            connection.execute(insert_sql, to_insert)

    return {"data": "Transportistas importados exitosamente", "inserted": len(to_insert)}
