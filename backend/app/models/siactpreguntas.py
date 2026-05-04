# flake8: noqa
from app.extensions import db, ma


class siactpreguntas(db.Model):
    __tablename__ = "siactpreguntas"

    ciacodigo = db.Column(db.String(2), nullable=False)
    pregcodigo = db.Column(db.String(13), nullable=False)
    pregsecuen = db.Column(db.Integer, nullable=False)
    pregtipo = db.Column(db.String(1), nullable=False)
    pregdescri = db.Column(db.String(100), nullable=False)
    pregstatus = db.Column(db.String(1), nullable=False)
    pregfecisys = db.Column(db.DateTime, nullable=False)
    pregorisys = db.Column(db.DateTime, nullable=False)
    pregusuisys = db.Column(db.String(50), nullable=False)
    pregestisys = db.Column(db.String(50), nullable=False)
    pregfecmsys = db.Column(db.DateTime, nullable=False)
    preghormsys = db.Column(db.DateTime, nullable=False)
    pregusumsys = db.Column(db.String(10), nullable=False)
    pregestmsys = db.Column(db.String(50), nullable=False)
    pregRespuesta = db.Column(db.String(1), nullable=False)

    __table_args__ = (
        db.PrimaryKeyConstraint("ciacodigo", "pregcodigo", "pregsecuen", name="PK_siactpreguntas"),
        db.ForeignKeyConstraint(
            ["ciacodigo", "pregcodigo"],
            ["siaccpreguntas.ciacodigo", "siaccpreguntas.pregcodigo"],
            name="FK_siactpreguntas_siaccpreguntas",
        ),
    )


class siactpreguntasSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siactpreguntas
