# flake8: noqa
from app.extensions import db, ma


class inbsgaclipro(db.Model):
    __tablename__ = "inbsgaclipro"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    clicodigo = db.Column(db.String(6), primary_key=True)
    procodigo = db.Column(db.String(6))
    extcodigo = db.Column(db.String(10), primary_key=True)
    cliprofecisys = db.Column(db.DateTime, nullable=False)
    cliprohorisys = db.Column(db.DateTime, nullable=False)
    cliprousuisys = db.Column(db.String(10), nullable=False)
    clibproestisys = db.Column(db.String(50), nullable=False)


class inbsgacliproSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbsgaclipro
