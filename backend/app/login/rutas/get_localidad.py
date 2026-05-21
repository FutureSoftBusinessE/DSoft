from flask import jsonify, request
from sqlalchemy import text
from app.login import bp
from app.extensions import db
from flask_cors import cross_origin
from services.encrip_desencrip import encriptar
from app.db import get_session


@bp.route("/get_localidad", methods=["POST"])
@cross_origin()
def get_localidad():
    # =========================================================================
    # 1. TRUCO MAESTRO: Limpiar el Token Viejo de la Petición
    # Como el fetchwrapper inyecta el token de la compañía anterior, get_session
    # se confunde y usa la IP incorrecta. Al borrarlo del 'environ', obligamos
    # a get_session a buscar la ruta correcta como si fuera el primer Login.
    # =========================================================================
    if 'HTTP_AUTHORIZATION' in request.environ:
        del request.environ['HTTP_AUTHORIZATION']

    # 2. Blindaje de lectura JSON (Anti Error 500)
    data = request.get_json(force=True, silent=True) or {}

    # 3. Extracción Segura
    user_data = data.get("user", "")
    cliciausu = encriptar(user_data) if user_data else ""

    seleccion = data.get("seleccion", {})
    ciacodigo = seleccion.get("cliciaciacodigo", "")
    clicianonBD = seleccion.get("clicianonBD", "")

    # Validación: Si falta info clave, retornamos lista vacía sin romper
    if not ciacodigo or not clicianonBD:
        return jsonify([])

    try:
        # Ahora get_session conectará a la IP real de la nueva compañía
        db.session = get_session(clicianonBD)
        engine = db.session.bind

        with engine.connect() as connection:
            # 4. USO DE SQL CRUDO para evitar bloqueos del ORM entre compañías
            query = text("""
                SELECT DISTINCT C.locdescri, C.loccodigo
                FROM cgblocal C
                JOIN siactloc S ON S.ciacodigo = C.ciacodigo AND S.loccodigo = C.loccodigo
                WHERE S.ciacodigo = :ciacodigo
                  AND S.usrcodigo = :usrcodigo
                  AND C.locstatus = 'A'
            """)

            result = connection.execute(query, {
                "ciacodigo": ciacodigo,
                "usrcodigo": cliciausu
            }).mappings().fetchall()

        # Formateo manual de la respuesta
        output = [{"locdescri": row["locdescri"], "loccodigo": row["loccodigo"]} for row in result]

        return jsonify(output)

    except Exception as e:
        print(f"Error de conexión dinámica en get_localidad: {str(e)}")
        # Si la base de datos destino está apagada, devolvemos vacío para no crashear React
        return jsonify([])
