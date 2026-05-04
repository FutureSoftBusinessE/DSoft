# flake8: noqa
from app.extensions import db


class siactformulariosrespondidos(db.Model):
    __tablename__ = "siactformulariosrespondidos"

    ciacodigo = db.Column(db.String(2), nullable=False)
    formrespondidocodigo = db.Column(db.String(13), nullable=False)
    formcodigo = db.Column(db.String(13), nullable=False)
    procesocod = db.Column(db.String(50), nullable=False)
    pregcodigo = db.Column(db.String(13), nullable=False)
    formsecuen = db.Column(db.Integer, nullable=False)
    formstatus = db.Column(db.String(1), nullable=False)
    formfecisys = db.Column(db.DateTime, nullable=False)
    formhorisys = db.Column(db.DateTime, nullable=False)
    formusuisys = db.Column(db.String(50), nullable=False)
    formestisys = db.Column(db.String(50), nullable=False)
    formfecmsys = db.Column(db.DateTime, nullable=False)
    formhormsys = db.Column(db.DateTime, nullable=False)
    formusumsys = db.Column(db.String(50), nullable=False)
    formestmsys = db.Column(db.String(50), nullable=False)

    __table_args__ = (
        db.PrimaryKeyConstraint(
            "ciacodigo",
            "formrespondidocodigo",
            "formcodigo",
            "procesocod",
            "pregcodigo",
            name="PK_medtformulariorespondido",
        ),
        db.ForeignKeyConstraint(
            ["ciacodigo", "formrespondidocodigo", "formcodigo"],
            [
                "siaccformulariosrespondidos.ciacodigo",
                "siaccformulariosrespondidos.formrespondidocodigo",
                "siaccformulariosrespondidos.formcodigo",
            ],
            name="FK_siactformulariosrespondidos_siaccformulariosrespondidos",
        ),
        db.ForeignKeyConstraint(
            ["ciacodigo", "formrespondidocodigo", "pregcodigo"],
            [
                "siaccpreguntasrespondidos.ciacodigo",
                "siaccpreguntasrespondidos.formrespondidocodigo",
                "siaccpreguntasrespondidos.pregcodigo",
            ],
            name="FK_siactformulariosrespondidos_siaccpreguntasrespondidos",
        ),
    )
