from flask import request
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.TiposCliente import bp
from app.db import get_session
from app.extensions import db
from error_handling import ValidationError, api_endpoint


@bp.route("/eliminarTiposCliente", methods=["POST"])
@cross_origin()
@jwt_required()
@api_endpoint
def eliminarTiposCliente():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]

    data = request.get_json() or {}
    # Always use company code from JWT selection
    sCodCia = claims["seleccion"]["cliciaciacodigo"]
    clicodigo = str(data.get("clicodigo") or "").strip()

    if not clicodigo:
        raise ValidationError("clicodigo es requerido")

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        with connection.begin():
            try:
                exists = connection.execute(
                    text(
                        """
                        SELECT 1
                        FROM cxcmcli
                        WHERE ciacodigo = :ciacodigo
                          AND clicodigo = :clicodigo
                        """
                    ),
                    {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                ).first()

                if not exists:
                    raise ValidationError(f"No existe ningún registro con clave ({sCodCia}, {clicodigo})")

                # Cascada explícita para no depender al 100% de ON DELETE CASCADE
                child_delete_order = [
                    "cxctclicontactos",
                    "cxctcliagencias",
                    "cxctcliven",
                    "cxctclireferencias",
                    "cxcbclidesc",
                    "cxcbclidescart",
                    "cxctclihistorial",
                    "cxchmcli",
                ]

                for table_name in child_delete_order:
                    connection.execute(
                        text(
                            f"""
                            DELETE FROM {table_name}
                            WHERE ciacodigo = :ciacodigo
                              AND clicodigo = :clicodigo
                            """
                        ),
                        {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                    )

                result = connection.execute(
                    text(
                        """
                        DELETE FROM cxcmcli
                        WHERE ciacodigo = :ciacodigo
                          AND clicodigo = :clicodigo
                        """
                    ),
                    {"ciacodigo": sCodCia, "clicodigo": clicodigo},
                )
            except IntegrityError:
                raise ValidationError("No se puede eliminar el registro porque existen datos relacionados")

            if result.rowcount == 0:
                raise ValidationError(f"No existe ningún registro con clave ({sCodCia}, {clicodigo})")

    return {"data": "Registro eliminado correctamente"}
