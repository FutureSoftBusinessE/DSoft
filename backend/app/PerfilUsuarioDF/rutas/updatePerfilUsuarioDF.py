from flask import request
from app.PerfilUsuarioDF import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from sqlalchemy import text
from error_handling import api_endpoint, ValidationError


@bp.route("/updatePerfilUsuarioDF", methods=["POST", "OPTIONS"], strict_slashes=False)
@cross_origin()
@jwt_required()
@api_endpoint
def updatePerfilUsuarioDF():
    if request.method == "OPTIONS":
        return {"success": True}, 200

    claims = get_jwt()

    # 1. VALIDACIÓN FLEXIBLE DE SEGURIDAD
    clicianonBD = claims["seleccion"]["clicianonBD"]
    ciacodigo = claims["seleccion"]["cliciaciacodigo"]
    loccodigo = claims["localidad"]["loccodigo"]

    if not clicianonBD or not ciacodigo:
        raise ValidationError("Error Crítico: Faltan las credenciales de base de datos o compañía en el token JWT.")

    sUsuario = claims.get("user")
    if not sUsuario:
        raise ValidationError("No se pudo identificar al usuario que intenta realizar la actualización.")

    # 2. VALIDACIÓN Y RECEPCIÓN DE PARÁMETROS DEL FRONTEND
    try:
        ciatipomenu = int(request.form.get("ciatipomenu", 0))
    except ValueError:
        ciatipomenu = 0

    ciacolor = str(request.form.get("ciacolor", "")).strip()
    ciatipoletra = str(request.form.get("ciatipoletra", "")).strip()
    ciatamanioletra = str(request.form.get("ciatamanioletra", "")).strip()

    emailsmtp = str(request.form.get("emailsmtp", "")).strip()
    emailmascara = str(request.form.get("emailmascara", "")).strip()
    emailsalida = str(request.form.get("emailsalida", "")).strip()
    emailtema = str(request.form.get("emailtema", "")).strip()
    emailmensaje = str(request.form.get("emailmensaje", "")).strip()
    emailsubject = str(request.form.get("emailsubject", "")).strip()

    cialogo_file = request.files.get("cialogo")
    ciaselloagua_file = request.files.get("ciaselloagua")

    # ==========================================================
    # 🛠️ MODO DEPURACIÓN: IMPRESIÓN EN CONSOLA NEGRA
    # ==========================================================
    print("\n" + "=" * 50)
    print("🛠️ INICIANDO UPDATE DE PERFIL DE USUARIO 🛠️")
    print("=" * 50)
    print(f"🔹 BD apuntada : {clicianonBD}")
    print(f"🔹 Compañía    : {ciacodigo}")
    print(f"🔹 Localidad   : {loccodigo}")
    print(f"🔹 Usuario     : {sUsuario}")
    print("-" * 50)
    print("📋 DATOS VISUALES RECIBIDOS:")
    print(f"  - ciatipomenu     : {ciatipomenu} (Tipo: {type(ciatipomenu)})")
    print(f"  - ciacolor        : '{ciacolor}'")
    print(f"  - ciatipoletra    : '{ciatipoletra}'")
    print(f"  - ciatamanioletra : '{ciatamanioletra}'")
    print("-" * 50)
    print("📧 DATOS DE CORREO RECIBIDOS:")
    print(f"  - emailsmtp       : '{emailsmtp}'")
    print(f"  - emailmascara    : '{emailmascara}'")
    print(f"  - emailsalida     : '{emailsalida}'")
    print(f"  - emailtema       : '{emailtema}'")
    print(f"  - emailsubject    : '{emailsubject}'")
    print(f"  - emailmensaje    : '{emailmensaje}'")
    print("-" * 50)
    print("🖼️ IMÁGENES RECIBIDAS:")
    print(f"  - Logo principal  : {'✅ Recibido' if cialogo_file else '❌ No se envió archivo'}")
    print(f"  - Marca de agua   : {'✅ Recibido' if ciaselloagua_file else '❌ No se envió archivo'}")
    print("=" * 50 + "\n")
    # ==========================================================

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            # --- Tabla: siaccia ---
            params_cia = {
                "ciatipomenu": ciatipomenu,
                "ciacolor": ciacolor,
                "ciatipoletra": ciatipoletra,
                "ciatamanioletra": ciatamanioletra,
                "ciacodigo": ciacodigo
            }

            update_cia_sql = """
                UPDATE siaccia SET
                    ciatipomenu = :ciatipomenu,
                    ciacolor = :ciacolor,
                    ciatipoletra = :ciatipoletra,
                    ciatamanioletra = :ciatamanioletra
            """

            if cialogo_file:
                update_cia_sql += ", cialogo = :cialogo"
                params_cia["cialogo"] = cialogo_file.read()

            if ciaselloagua_file:
                update_cia_sql += ", ciaselloagua = :ciaselloagua"
                params_cia["ciaselloagua"] = ciaselloagua_file.read()

            update_cia_sql += " WHERE ciacodigo = :ciacodigo"

            connection.execute(text(update_cia_sql), params_cia)

            # --- Tabla: cgblocal ---
            update_loc_sql = """
                UPDATE cgblocal SET
                    emailsmtp = :emailsmtp,
                    emailmascara = :emailmascara,
                    emailsalida = :emailsalida,
                    emailtema = :emailtema,
                    emailmensaje = :emailmensaje,
                    emailsubject = :emailsubject
                WHERE ciacodigo = :ciacodigo AND loccodigo = :loccodigo
            """
            params_loc = {
                "emailsmtp": emailsmtp,
                "emailmascara": emailmascara,
                "emailsalida": emailsalida,
                "emailtema": emailtema,
                "emailmensaje": emailmensaje,
                "emailsubject": emailsubject,
                "ciacodigo": ciacodigo,
                "loccodigo": loccodigo
            }

            connection.execute(text(update_loc_sql), params_loc)

    return {"data": "Perfil de empresa actualizado con éxito"}
