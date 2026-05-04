from flask import jsonify, request
from app.AccesoALocalidades import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from app.db import get_session
from services.encrip_desencrip import encriptar
from app import create_app
from sqlalchemy import Table, text
from datetime import datetime
from app.utils.build_paginated_query import build_paginated_query
from app.Clases.FILTER_VALUE_TYPE import FILTER_VALUE_TYPE
from services.encrip_desencrip import desencriptar
import base64


@bp.route("/guardarPermisosLocalidades", methods=["POST"])
@cross_origin()
@jwt_required()
def guardar_permisos_localidades():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    usuario_actual = claims["user"]

    data = request.get_json()

    if not data or "permisos" not in data:
        return jsonify({"error": {"success": False, "msg": "Datos de permisos requeridos"}}), 500

    permisos = data["permisos"]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    resultados = []
    try:
        with engine.connect() as connection:
            with connection.begin():
                for perm in permisos:
                    loccodigo = perm["loccodigo"]
                    usrcodigo = perm["usrcodigo"]
                    locaccion = perm["locaccion"]

                    # Preparamos los datos comunes
                    now = datetime.now()
                    fecha_actual = now.strftime("%Y-%m-%d")
                    hora_actual = now.strftime("%H:%M:%S")

                    # Datos base para insert/update (LO QUE SE VA A GUARDAR)
                    datos_base = {
                        "ciacodigo": ciacodigo,
                        "usrcodigo": encriptar(usrcodigo),
                        "loccodigo": loccodigo,
                        "locfecmsys": fecha_actual,
                        "lochormsys": hora_actual,
                        "locusumsys": encriptar(usuario_actual),
                        "locestmsys": f"{fecha_actual} {hora_actual}",
                        "locaccion": "UPDATE",  # En siactloc siempre será UPDATE después de guardar
                        # Booleanos
                        "usrflagcaj": perm.get("usrflagcaj", 0),
                        "usrflagsup": perm.get("usrflagsup", 0),
                        "usrflagger": perm.get("usrflagger", 0),
                        # ... todos los campos igual que tienes
                        # Numéricos
                        "usrcajdesc": float(perm.get("usrcajdesc", 0.0)),
                        "usrsupdesc": float(perm.get("usrsupdesc", 0.0)),
                        # ... todos los campos numéricos
                    }

                    if locaccion == "DELETE":
                        # DELETE: Copiar el registro ANTES de eliminar
                        query_select_existente = """
                        SELECT * FROM siactloc
                        WHERE ciacodigo = :ciacodigo
                        AND usrcodigo = :usrcodigo
                        AND loccodigo = :loccodigo
                        """

                        existente = connection.execute(text(query_select_existente), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo), "loccodigo": loccodigo}).mappings().fetchone()

                        if existente:
                            # Copiar a auditoría con estado DELETE
                            datos_auditoria = dict(existente)
                            datos_auditoria["locaccion"] = "DELETE"
                            datos_auditoria["locfecmsys"] = fecha_actual
                            datos_auditoria["lochormsys"] = hora_actual
                            datos_auditoria["locusumsys"] = encriptar(usuario_actual)

                            # Insertar en auditoría
                            columns_aud = ", ".join(datos_auditoria.keys())
                            placeholders_aud = ", ".join([f":{key}" for key in datos_auditoria.keys()])

                            query_insert_aud = f"""
                            INSERT INTO siachtloc ({columns_aud})
                            VALUES ({placeholders_aud})
                            """

                            connection.execute(text(query_insert_aud), datos_auditoria)

                            # Eliminar de siactloc
                            query_delete = """
                            DELETE FROM siactloc
                            WHERE ciacodigo = :ciacodigo
                            AND usrcodigo = :usrcodigo
                            AND loccodigo = :loccodigo
                            """

                            connection.execute(text(query_delete), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo), "loccodigo": loccodigo})

                            resultados.append({"loccodigo": loccodigo, "accion": "DELETE", "mensaje": "Registro eliminado y copiado a auditoría"})

                    elif locaccion in ["CREATE", "UPDATE"]:
                        # Primero: COPIAR A AUDITORÍA con los DATOS NUEVOS
                        datos_auditoria = datos_base.copy()
                        datos_auditoria["locaccion"] = locaccion  # CREATE o UPDATE según lo que viene del frontend

                        # Insertar en auditoría (SICTHLOC)
                        columns_aud = ", ".join(datos_auditoria.keys())
                        placeholders_aud = ", ".join([f":{key}" for key in datos_auditoria.keys()])

                        query_insert_aud = f"""
                        INSERT INTO siachtloc ({columns_aud})
                        VALUES ({placeholders_aud})
                        """

                        connection.execute(text(query_insert_aud), datos_auditoria)

                        # Luego: Insertar o actualizar en siactloc
                        # Verificar si ya existe
                        query_check = """
                        SELECT COUNT(*) as count FROM siactloc
                        WHERE ciacodigo = :ciacodigo
                        AND usrcodigo = :usrcodigo
                        AND loccodigo = :loccodigo
                        """

                        count_result = connection.execute(text(query_check), {"ciacodigo": ciacodigo, "usrcodigo": encriptar(usrcodigo), "loccodigo": loccodigo}).scalar()

                        exists = count_result > 0

                        if exists:
                            # UPDATE registro existente
                            set_clause = ", ".join([f"{key} = :{key}" for key in datos_base.keys() if key not in ["ciacodigo", "usrcodigo", "loccodigo"]])

                            query_update = f"""
                            UPDATE siactloc
                            SET {set_clause}
                            WHERE ciacodigo = :ciacodigo
                            AND usrcodigo = :usrcodigo
                            AND loccodigo = :loccodigo
                            """

                            connection.execute(text(query_update), datos_base)

                            resultados.append({"loccodigo": loccodigo, "accion": "UPDATE", "mensaje": "Registro actualizado"})
                        else:
                            # INSERT nuevo registro
                            columns = ", ".join(datos_base.keys())
                            placeholders = ", ".join([f":{key}" for key in datos_base.keys()])

                            query_insert = f"""
                            INSERT INTO siactloc ({columns})
                            VALUES ({placeholders})
                            """

                            connection.execute(text(query_insert), datos_base)

                            resultados.append({"loccodigo": loccodigo, "accion": "CREATE", "mensaje": "Registro creado"})

        return jsonify({"success": True, "message": "Permisos guardados correctamente", "resultados": resultados}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": {"success": False, "msg": f"Error al obtener permisos: {str(e)}"}}), 500
