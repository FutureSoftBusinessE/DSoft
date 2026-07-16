from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.ImpuestosRetenciones import bp
from app.extensions import db
from app.db import get_session
from datetime import datetime
from error_handling import api_endpoint, ValidationError, NotFoundError


@bp.route("/replicarImpuesto", methods=["POST"])
@jwt_required()
@api_endpoint
def replicarImpuesto():
    """
    Replica un impuesto/retencion desde la compania 01 (DSoft) a las companias destino.

    Para cada compania destino, el request debe indicar la accion a realizar:
    - "crear": Solo inserta si no existe. Si ya existe, omite esa compania.
    - "sobrescribir": Si existe, actualiza. Si no existe, inserta.

    Cada compania se procesa de forma independiente.
    No se replican las cuentas contables (impctanor, impctadol).
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    sUsuario = claims["user"]

    # Solo la compania 01 (DSoft) puede replicar
    if sCodCia != "01":
        raise ValidationError("No autorizado. Solo DSoft puede replicar impuestos o retenciones.")

    data = request.get_json()
    impid_origen = data.get("impid_origen", "").strip()
    companias_acciones = data.get("companias_acciones", [])

    """
    Formato esperado de companias_acciones:
    [
        {"ciacodigo": "02", "accion": "crear"},
        {"ciacodigo": "03", "accion": "sobrescribir"},
        {"ciacodigo": "04", "accion": "crear"},
        {"ciacodigo": "05", "accion": "sobrescribir"}
    ]
    """

    if not impid_origen:
        raise ValidationError("Debe especificar el impuesto origen.")

    if not companias_acciones or not isinstance(companias_acciones, list):
        raise ValidationError("Debe especificar al menos una compania destino con su accion.")

    # Validar que las acciones sean validas
    for item in companias_acciones:
        accion = item.get("accion")
        ciacodigo = item.get("ciacodigo")
        if not ciacodigo:
            raise ValidationError("Cada elemento debe tener un ciacodigo.")
        if accion not in ["crear", "sobrescribir"]:
            raise ValidationError(f"Accion invalida '{accion}' para compania {ciacodigo}. Debe ser 'crear' o 'sobrescribir'.")

    # Obtener fecha y hora actuales para auditoria
    fecha_actual = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hora_sys = datetime.now().replace(year=1900, month=1, day=1, microsecond=0)

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # Obtener el impuesto origen de DSoft
            query_origen = text(
                """
                SELECT
                    impid, impdescri, impporcent, impretimp, impesiva,
                    impaplica, impbienser, codSRI, desSRI, impstatus
                FROM cxpbimp
                WHERE ciacodigo = '01' AND impid = :impid
            """
            )
            result_origen = connection.execute(query_origen, {"impid": impid_origen}).mappings().fetchone()

            if not result_origen:
                raise NotFoundError("Impuesto origen no encontrado en DSoft.")

            origen = dict(result_origen)
            resultados = []

            for item in companias_acciones:
                ciacodigo = item["ciacodigo"]
                accion = item["accion"]

                try:
                    # Obtener nombre de la compania para mostrar en resultados
                    query_nombre = text(
                        """
                        SELECT ciadescri FROM siaccia WHERE ciacodigo = :ciacodigo
                    """
                    )
                    nombre_cia = connection.execute(query_nombre, {"ciacodigo": ciacodigo}).mappings().fetchone()
                    nombre = nombre_cia["ciadescri"] if nombre_cia else ciacodigo

                    # Verificar si el impuesto ya existe en la compania destino
                    query_existe = text(
                        """
                        SELECT impid FROM cxpbimp
                        WHERE ciacodigo = :ciacodigo AND impid = :impid
                    """
                    )
                    existe = connection.execute(query_existe, {"ciacodigo": ciacodigo, "impid": impid_origen}).mappings().fetchone()

                    if accion == "crear":
                        # Modo crear: solo inserta si NO existe. Si ya existe, omite.
                        if existe:
                            resultados.append({"ciacodigo": ciacodigo, "ciadescri": nombre, "estado": "omitido", "mensaje": "El impuesto ya existe en esta compania. Se omite por modo crear."})
                        else:
                            # INSERT: Nuevo registro sin cuenta contable
                            query_insert = text(
                                """
                                INSERT INTO cxpbimp (
                                    ciacodigo, impid, impdescri, impctadol, impctanor,
                                    impporcent, impesiva, impaplica, impstatus, impretimp,
                                    codSRI, desSRI, impbienser,
                                    impfecisys, imphorisys, impusuisys,
                                    impfecmsys, imphormsys, impusumsys
                                ) VALUES (
                                    :ciacodigo, :impid, :impdescri, :impctadol, :impctanor,
                                    :impporcent, :impesiva, :impaplica, :impstatus, :impretimp,
                                    :codSRI, :desSRI, :impbienser,
                                    :impfecisys, :imphorisys, :impusuisys,
                                    :impfecmsys, :imphormsys, :impusumsys
                                )
                            """
                            )
                            connection.execute(
                                query_insert,
                                {
                                    "ciacodigo": ciacodigo,
                                    "impid": impid_origen,
                                    "impdescri": origen["impdescri"],
                                    "impctadol": "",  # Sin cuenta contable dolar
                                    "impctanor": "",  # Sin cuenta contable local
                                    "impporcent": origen["impporcent"],
                                    "impesiva": origen["impesiva"],
                                    "impaplica": origen["impaplica"],
                                    "impstatus": origen["impstatus"],
                                    "impretimp": origen["impretimp"],
                                    "codSRI": origen["codSRI"] or "",
                                    "desSRI": origen["desSRI"] or "",
                                    "impbienser": origen["impbienser"],
                                    "impfecisys": fecha_actual,
                                    "imphorisys": hora_sys,
                                    "impusuisys": sUsuario,
                                    "impfecmsys": fecha_actual,
                                    "imphormsys": hora_sys,
                                    "impusumsys": sUsuario,
                                },
                            )
                            resultados.append({"ciacodigo": ciacodigo, "ciadescri": nombre, "estado": "creado"})

                    elif accion == "sobrescribir":
                        # Modo sobrescribir: si existe actualiza, si no existe inserta.
                        if existe:
                            # UPDATE: Actualizar campos editables sin tocar cuentas contables
                            query_update = text(
                                """
                                UPDATE cxpbimp SET
                                    impdescri = :impdescri,
                                    impporcent = :impporcent,
                                    impesiva = :impesiva,
                                    impaplica = :impaplica,
                                    impretimp = :impretimp,
                                    codSRI = :codSRI,
                                    desSRI = :desSRI,
                                    impbienser = :impbienser,
                                    impstatus = :impstatus,
                                    impfecmsys = :impfecmsys,
                                    imphormsys = :imphormsys,
                                    impusumsys = :impusumsys
                                WHERE ciacodigo = :ciacodigo AND impid = :impid
                            """
                            )
                            connection.execute(
                                query_update,
                                {
                                    "impdescri": origen["impdescri"],
                                    "impporcent": origen["impporcent"],
                                    "impesiva": origen["impesiva"],
                                    "impaplica": origen["impaplica"],
                                    "impretimp": origen["impretimp"],
                                    "codSRI": origen["codSRI"] or "",
                                    "desSRI": origen["desSRI"] or "",
                                    "impbienser": origen["impbienser"],
                                    "impstatus": origen["impstatus"],
                                    "impfecmsys": fecha_actual,
                                    "imphormsys": hora_sys,
                                    "impusumsys": sUsuario,
                                    "ciacodigo": ciacodigo,
                                    "impid": impid_origen,
                                },
                            )
                            resultados.append({"ciacodigo": ciacodigo, "ciadescri": nombre, "estado": "actualizado"})
                        else:
                            # INSERT: No existe, se crea nuevo
                            query_insert = text(
                                """
                                INSERT INTO cxpbimp (
                                    ciacodigo, impid, impdescri, impctadol, impctanor,
                                    impporcent, impesiva, impaplica, impstatus, impretimp,
                                    codSRI, desSRI, impbienser,
                                    impfecisys, imphorisys, impusuisys,
                                    impfecmsys, imphormsys, impusumsys
                                ) VALUES (
                                    :ciacodigo, :impid, :impdescri, :impctadol, :impctanor,
                                    :impporcent, :impesiva, :impaplica, :impstatus, :impretimp,
                                    :codSRI, :desSRI, :impbienser,
                                    :impfecisys, :imphorisys, :impusuisys,
                                    :impfecmsys, :imphormsys, :impusumsys
                                )
                            """
                            )
                            connection.execute(
                                query_insert,
                                {
                                    "ciacodigo": ciacodigo,
                                    "impid": impid_origen,
                                    "impdescri": origen["impdescri"],
                                    "impctadol": "",
                                    "impctanor": "",
                                    "impporcent": origen["impporcent"],
                                    "impesiva": origen["impesiva"],
                                    "impaplica": origen["impaplica"],
                                    "impstatus": origen["impstatus"],
                                    "impretimp": origen["impretimp"],
                                    "codSRI": origen["codSRI"] or "",
                                    "desSRI": origen["desSRI"] or "",
                                    "impbienser": origen["impbienser"],
                                    "impfecisys": fecha_actual,
                                    "imphorisys": hora_sys,
                                    "impusuisys": sUsuario,
                                    "impfecmsys": fecha_actual,
                                    "imphormsys": hora_sys,
                                    "impusumsys": sUsuario,
                                },
                            )
                            resultados.append({"ciacodigo": ciacodigo, "ciadescri": nombre, "estado": "creado"})

                except Exception as e:
                    # Si falla una compania, se registra el error y se continua con las demas
                    resultados.append({"ciacodigo": ciacodigo, "ciadescri": ciacodigo, "estado": "error", "mensaje": str(e)})

            # Calcular resumen final
            total = len(resultados)
            creados = sum(1 for r in resultados if r["estado"] == "creado")
            actualizados = sum(1 for r in resultados if r["estado"] == "actualizado")
            omitidos = sum(1 for r in resultados if r["estado"] == "omitido")
            errores = sum(1 for r in resultados if r["estado"] == "error")

    return {"data": {"resultados": resultados, "resumen": {"total_procesadas": total, "creados": creados, "actualizados": actualizados, "omitidos": omitidos, "errores": errores}}}
