from flask import jsonify, request
from app.AccesoAOpcionesPorModulos import bp
from app.extensions import db

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.db import get_session
from services.encrip_desencrip import encriptar, desencriptar
from datetime import datetime


# API para guardar permisos completos (opciones + acciones)
@bp.route("/save_permisos_completos", methods=["POST"])
@jwt_required()
def save_permisos_completos():
    """
    Guarda permisos COMPLETOS - Versión SEGURA con reemplazo total
    """
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sUsuario = claims["user"]
    sNomEst = request.headers.get("X-Forwarded-For", request.remote_addr)

    data = request.get_json()
    txtUsrCodigo = data.get("txtUsrCodigo")
    usrflagperfil = data.get("usrflagperfil", 0)
    updateAllPerfiles = data.get("updateAllPerfiles", False)
    ciacodigo = data.get("dcbCia")  # Codigo de la compania del usario que se van a crear los permisos
    dcbMod = data.get("dcbMod")
    opciones = data.get("opciones", [])
    acciones = data.get("acciones", [])

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    try:
        with engine.connect() as connection:
            with connection.begin():
                print("=== GUARDANDO PERMISOS ===")
                print(f"Usuario: {txtUsrCodigo}, Módulo: {dcbMod}")
                print(f"Opciones a guardar: {len(opciones)}")
                print(f"Acciones a guardar: {len(acciones)}")

                # ========== 1. GUARDAR OPCIONES DE MENÚ ==========
                # Eliminar permisos anteriores del usuario
                delete_opciones_query = """
                DELETE FROM SiactUsrWeb
                WHERE usrcodigo = :usrcodigo
                    AND ciacodigo = :ciacodigo
                    AND modcodigo = :modcodigo
                """
                connection.execute(
                    text(delete_opciones_query),
                    {
                        "usrcodigo": encriptar(txtUsrCodigo),
                        "ciacodigo": ciacodigo,
                        "modcodigo": dcbMod,
                    },
                )

                # Insertar nuevas opciones permitidas
                opciones_guardadas = 0
                for opcion in opciones:
                    if opcion.get("permiso"):
                        insert_opcion_query = """
                        INSERT INTO SiactUsrWeb
                            (ciacodigo, usrcodigo, modcodigo, opctag, usrusuisys, usrestisys, id_item)
                        VALUES
                            (:ciacodigo, :usrcodigo, :modcodigo, :opctag, :usrusuisys, :usrestisys, NULL)
                        """
                        connection.execute(
                            text(insert_opcion_query),
                            {
                                "ciacodigo": ciacodigo,
                                "usrcodigo": encriptar(txtUsrCodigo),
                                "modcodigo": dcbMod,
                                "opctag": opcion["opctag"],
                                "usrusuisys": sUsuario,
                                "usrestisys": sNomEst,
                            },
                        )
                        opciones_guardadas += 1

                # ========== 2. GUARDAR ACCIONES ESPECÍFICAS ==========
                # Verificar si existe la tabla
                table_check_query = """
                SELECT CASE WHEN EXISTS (
                    SELECT 1 FROM information_schema.tables WHERE table_name = 'siactusrwebbar'
                ) THEN 1 ELSE 0 END as table_exists
                """
                table_exists = connection.execute(text(table_check_query)).scalar() == 1

                acciones_guardadas = 0
                if table_exists:
                    # OPCIÓN SEGURA: REEMPLAZO COMPLETO
                    # 1. Eliminar TODAS las acciones anteriores del usuario
                    delete_all_query = """
                    DELETE FROM siactusrwebbar
                    WHERE usrcodigo = :usrcodigo
                        AND ciacodigo = :ciacodigo
                        AND modcodigo = :modcodigo
                    """
                    connection.execute(
                        text(delete_all_query),
                        {"usrcodigo": encriptar(txtUsrCodigo), "ciacodigo": ciacodigo, "modcodigo": dcbMod},
                    )

                    print("Acciones anteriores eliminadas")

                    # 2. Insertar SOLO las nuevas acciones que envía el frontend
                    for accion in acciones:
                        insert_accion_query = """
                        INSERT INTO siactusrwebbar
                            (ciacodigo, usrcodigo, modcodigo, opctag, opccontroller, acccaption,
                             usrusuisys, usrestisys, usrfecisys)
                        VALUES
                            (:ciacodigo, :usrcodigo, :modcodigo, :opctag, :opccontroller, :acccaption,
                             :usrusuisys, :usrestisys, GETDATE())
                        """
                        connection.execute(
                            text(insert_accion_query),
                            {
                                "ciacodigo": ciacodigo,
                                "usrcodigo": encriptar(txtUsrCodigo),
                                "modcodigo": dcbMod,
                                "opctag": accion["opctag"],
                                "opccontroller": accion.get("opccontroller"),
                                "acccaption": accion["acccaption"],
                                "usrusuisys": sUsuario,
                                "usrestisys": sNomEst,
                            },
                        )
                        acciones_guardadas += 1

                    print(f"✅ {acciones_guardadas} acciones nuevas insertadas")

                # ========== 3. ACTUALIZAR USUARIOS CON EL MISMO PERFIL ==========
                if usrflagperfil != 0 and updateAllPerfiles:
                    print("🔄 Actualizando usuarios con mismo perfil...")
                    # Obtener usuarios con el mismo perfil
                    users_query = """
                    SELECT usrcodigo
                    FROM siaccusr
                    WHERE usrcodper = :usrcodper
                    """
                    users_result = connection.execute(text(users_query), {"usrcodper": encriptar(txtUsrCodigo)}).mappings().fetchall()

                    usuarios_actualizados = 0
                    for user in users_result:
                        user_codigo = user["usrcodigo"]  # Ya encriptado
                        usuarios_actualizados += 1

                        # Actualizar opciones de menú
                        delete_user_opciones_query = """
                        DELETE FROM SiactUsrWeb
                        WHERE usrcodigo = :usrcodigo
                            AND ciacodigo = :ciacodigo
                            AND modcodigo = :modcodigo
                        """
                        connection.execute(
                            text(delete_user_opciones_query),
                            {
                                "usrcodigo": user_codigo,
                                "ciacodigo": ciacodigo,
                                "modcodigo": dcbMod,
                            },
                        )

                        # Insertar mismas opciones
                        for opcion in opciones:
                            if opcion.get("permiso"):
                                insert_user_opcion_query = """
                                INSERT INTO SiactUsrWeb
                                    (ciacodigo, usrcodigo, modcodigo, opctag, usrusuisys, usrestisys, id_item)
                                SELECT
                                    ciacodigo, :usrcodigo, modcodigo, opctag, :usrusuisys, :usrestisys, id_item
                                FROM SiactUsrWeb
                                WHERE usrcodigo = :profile_usrcodigo
                                    AND ciacodigo = :ciacodigo
                                    AND modcodigo = :modcodigo
                                    AND opctag = :opctag
                                """
                                connection.execute(
                                    text(insert_user_opcion_query),
                                    {
                                        "usrcodigo": user_codigo,
                                        "profile_usrcodigo": encriptar(txtUsrCodigo),
                                        "ciacodigo": ciacodigo,
                                        "modcodigo": dcbMod,
                                        "opctag": opcion["opctag"],
                                        "usrusuisys": sUsuario,
                                        "usrestisys": sNomEst,
                                    },
                                )

                        # Actualizar acciones si la tabla existe
                        if table_exists:
                            delete_user_acciones_query = """
                            DELETE FROM siactusrwebbar
                            WHERE usrcodigo = :usrcodigo
                                AND ciacodigo = :ciacodigo
                                AND modcodigo = :modcodigo
                            """
                            connection.execute(
                                text(delete_user_acciones_query),
                                {"usrcodigo": user_codigo, "ciacodigo": ciacodigo, "modcodigo": dcbMod},
                            )

                            # Insertar mismas acciones
                            for accion in acciones:
                                insert_user_accion_query = """
                                INSERT INTO siactusrwebbar
                                    (ciacodigo, usrcodigo, modcodigo, opctag, opccontroller, acccaption,
                                     usrusuisys, usrestisys, usrfecisys)
                                SELECT
                                    ciacodigo, :usrcodigo, modcodigo, opctag, opccontroller,acccaption,
                                    :usrusuisys, :usrestisys, GETDATE()
                                FROM siactusrwebbar
                                WHERE usrcodigo = :profile_usrcodigo
                                    AND ciacodigo = :ciacodigo
                                    AND modcodigo = :modcodigo
                                    AND opctag = :opctag
                                    AND opccontroller = :opccontroller
                                    AND acccaption = :acccaption
                                """
                                connection.execute(
                                    text(insert_user_accion_query),
                                    {
                                        "usrcodigo": user_codigo,
                                        "profile_usrcodigo": encriptar(txtUsrCodigo),
                                        "ciacodigo": ciacodigo,
                                        "modcodigo": dcbMod,
                                        "opctag": accion["opctag"],
                                        "opccontroller": accion.get("opccontroller", ""),
                                        "acccaption": accion["acccaption"],
                                        "usrusuisys": sUsuario,
                                        "usrestisys": sNomEst,
                                    },
                                )

                    print(f"✅ {usuarios_actualizados} usuarios actualizados")

                return (
                    jsonify(
                        {
                            "data": {"msg": "Permisos guardados exitosamente", "opciones_guardadas": opciones_guardadas, "acciones_guardadas": acciones_guardadas, "modo": "reemplazo_completo", "usuarios_actualizados": usuarios_actualizados if usrflagperfil != 0 and updateAllPerfiles else 0},
                            "status": "ok",
                        }
                    ),
                    200,
                )

    except Exception as e:
        print(f"❌ Error guardando permisos: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": {"msg": f"Error al guardar permisos: {str(e)}"}}), 400
