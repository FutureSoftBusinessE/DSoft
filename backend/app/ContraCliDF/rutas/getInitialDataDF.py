from flask import request

from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import text
from app.ContraCliDF import bp
from app.extensions import db
from app.db import get_session
from error_handling import api_endpoint


@bp.route("/getInitialDataDF", methods=["POST"])
@jwt_required()
@api_endpoint
def getInitialDataDF():
    claims = get_jwt()
    clicianonBD = claims["seleccion"]["clicianonBD"]
    sCodCia = str(claims["seleccion"]["cliciaciacodigo"]).strip()[:2]

    db.session = get_session(clicianonBD)
    engine = db.session.bind

    with engine.connect() as connection:
        # Clientes Activos
        clientes = (
            connection.execute(
                text(
                    """
            SELECT clicodigo, clinombre
            FROM cxcmcli
            WHERE ciacodigo = :cia AND clistatus = 'A'
            ORDER BY clinombre
        """
                ),
                {"cia": sCodCia},
            )
            .mappings()
            .fetchall()
        )

        # Clientes Activos y de tipo asociados
        clientesAso = (
            connection.execute(
                text(
                    """
            SELECT clicodigo, clinombre
            FROM cxcmcli
            WHERE ciacodigo = :cia AND clistatus = 'A' and tipcodigo = 'ASO'
            ORDER BY clinombre
        """
                ),
                {"cia": sCodCia},
            )
            .mappings()
            .fetchall()
        )

        # Tipos de Contrato y sus frecuencias
        tipos = (
            connection.execute(
                text(
                    """
            SELECT concodigo, condescri, confrecuencia
            FROM cxcbtipcon
            WHERE ciacodigo = :cia
            ORDER BY condescri
        """
                ),
                {"cia": sCodCia},
            )
            .mappings()
            .fetchall()
        )

        # Artículos (Servicios) disponibles para la grilla
        articulos = (
            connection.execute(
                text(
                    """
            SELECT invcodigo, artcodigo, artdescri, artprecventa1 AS precio1
            FROM inmart
            WHERE ciacodigo = :cia
              AND artstatus = 'A'
              AND artprodven <> 0
              AND artservicio <> 0
            ORDER BY artdescri
        """
                ),
                {"cia": sCodCia},
            )
            .mappings()
            .fetchall()
        )

    return {"data": {"clientes": [dict(c) for c in clientes], "clientesAso": [dict(c) for c in clientesAso], "tiposContrato": [dict(t) for t in tipos], "articulos": [dict(a) for a in articulos]}}
