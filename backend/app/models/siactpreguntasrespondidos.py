# flake8: noqa
from app.extensions import db


class siactpreguntasrespondidos(db.Model):
    __tablename__ = "siactpreguntasrespondidos"

    ciacodigo = db.Column(db.String(2), nullable=False)
    formrespondidocodigo = db.Column(db.String(13), nullable=False)
    pregcodigo = db.Column(db.String(13), nullable=False)
    pregsecuen = db.Column(db.Integer, nullable=False)
    pregtipo = db.Column(db.String(1), nullable=False)
    pregdescri = db.Column(db.String(100), nullable=False)
    pregstatus = db.Column(db.String(1), nullable=False)
    pregRespuesta = db.Column(db.String(1), nullable=False, default="0")
    pregrespondido = db.Column(db.String(100), nullable=False)
    pregfecisys = db.Column(db.DateTime, nullable=False)
    pregorisys = db.Column(db.DateTime, nullable=False)
    pregusuisys = db.Column(db.String(50), nullable=False)
    pregestisys = db.Column(db.String(50), nullable=False)
    pregfecmsys = db.Column(db.DateTime, nullable=False)
    preghormsys = db.Column(db.DateTime, nullable=False)
    pregusumsys = db.Column(db.String(10), nullable=False)
    pregestmsys = db.Column(db.String(50), nullable=False)

    __table_args__ = (
        db.PrimaryKeyConstraint("ciacodigo", "formrespondidocodigo", "pregcodigo", "pregsecuen", name="PK_siactpreguntasrespondidos"),
        db.ForeignKeyConstraint(
            ["ciacodigo", "formrespondidocodigo", "pregcodigo"],
            [
                "siaccpreguntasrespondidos.ciacodigo",
                "siaccpreguntasrespondidos.formrespondidocodigo",
                "siaccpreguntasrespondidos.pregcodigo",
            ],
            name="FK_siactpreguntasrespondidos_siaccpreguntasrespondidos",
        ),
    )
