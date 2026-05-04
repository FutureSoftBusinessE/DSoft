# flake8: noqa
from flask import jsonify, request
from app.PaquetesDeProcesosTareas import bp
from app.extensions import db
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from app.db import get_session
from app.models.gdoccpaquetes import gdoccpaquetes, gdoccpaquetesSchema
from app.models.gdoctpaquetes import gdoctpaquetes
from app.models.gdocctareas import gdocctareas, gdocctareasSchema
from services.encrip_desencrip import encriptar
from sqlalchemy import asc, desc


@bp.route("/getAllPaquetesConDetalle", methods=["GET"])
@cross_origin()
@jwt_required()
def getAllPaquetesConDetalle():

    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    ciacodigo = claims["seleccion"]["cliciaciacodigo"]

    db.session = get_session(clicianonBD)

    try:
        # 1. Obtener todos los paquetes (cabeceras)
        paquetes_cabecera = db.session.query(gdoccpaquetes).filter(gdoccpaquetes.ciacodigo == ciacodigo).order_by(desc(gdoccpaquetes.formcodigo)).all()

        schema_cabecera = gdoccpaquetesSchema(many=True)
        cabeceras = schema_cabecera.dump(paquetes_cabecera)

        resultado = []

        # 2. Para cada paquete, obtener sus tareas (solo las que están en el paquete - data2)
        for cabecera in cabeceras:
            formcodigo = cabecera["formcodigo"]

            # Obtener los códigos de tareas que están en este paquete
            subquery = (
                db.session.query(gdoctpaquetes.pregcodigo)
                .filter(
                    gdoctpaquetes.formcodigo == formcodigo,
                    gdoctpaquetes.ciacodigo == ciacodigo,
                )
                .distinct()
            )

            # Obtener las tareas del paquete
            tareas_paquete = (
                db.session.query(gdocctareas)
                .filter(
                    gdocctareas.pregcodigo.in_(subquery),
                    gdocctareas.ciacodigo == ciacodigo,
                )
                .all()
            )

            schema_tareas = gdocctareasSchema(many=True)
            detalle = schema_tareas.dump(tareas_paquete)

            # Agregar al resultado
            resultado.append({"cabecera": cabecera, "detalle": detalle})

        return jsonify({"success": True, "data": resultado, "count": len(resultado)})

    except Exception as e:
        db.session.rollback()
        return (
            jsonify({"success": False, "message": f"Error al obtener paquetes: {str(e)}"}),
            500,
        )
