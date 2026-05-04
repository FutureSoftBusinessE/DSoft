# flake8: noqa
from app.extensions import db
from app.extensions import ma


class siacsec(db.Model):
    __tablename__ = "siacsec"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    locservidor = db.Column(db.String(1), primary_key=True)
    seccodigo = db.Column(db.String(3), primary_key=True)
    secnumero = db.Column(db.Integer, nullable=False)
    secfecisys = db.Column(db.DateTime)
    secfecmsys = db.Column(db.DateTime)
    sechorisys = db.Column(db.DateTime)
    sechormsys = db.Column(db.DateTime)
    secusuisys = db.Column(db.String(10))
    secusumsys = db.Column(db.String(10))
    secdescri = db.Column(db.String(200))


class siacsecSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siacsec
