# flake8: noqa
from app.extensions import db


class siaccpreguntasrespondidos(db.Model):
    __tablename__ = "siaccpreguntasrespondidos"

    ciacodigo = db.Column(db.String(2), nullable=False, primary_key=True)
    formrespondidocodigo = db.Column(db.String(13), nullable=False, primary_key=True)
    pregcodigo = db.Column(db.String(13), nullable=False, primary_key=True)
    pregdescri = db.Column(db.String(100), nullable=False)
    pregtipo = db.Column(db.String(1), nullable=False)
    pregobligatoria = db.Column(db.Integer, default=0, nullable=False)
    pregstatus = db.Column(db.String(1), nullable=False)
    pregfecisys = db.Column(db.DateTime, nullable=False)
    pregorisys = db.Column(db.DateTime, nullable=False)
    pregusuisys = db.Column(db.String(50), nullable=False)
    pregestisys = db.Column(db.String(50), nullable=False)
    pregfecmsys = db.Column(db.DateTime, nullable=False)
    preghormsys = db.Column(db.DateTime, nullable=False)
    pregusumsys = db.Column(db.String(10), nullable=False)
    pregestmsys = db.Column(db.String(50), nullable=False)

    __table_args__ = (db.PrimaryKeyConstraint("ciacodigo", "formrespondidocodigo", "pregcodigo", name="PK_siaccpreguntasrespondidos"),)
