# flake8: noqa
from app.extensions import db, ma


class Fatpedcarpro(db.Model):
    __tablename__ = "fatpedcarpro"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    pednumped = db.Column(db.String(18), primary_key=True)
    loccodigo = db.Column(db.String(2), primary_key=True)
    facsecuen = db.Column(db.Integer, primary_key=True)
    prosecuen = db.Column(db.Integer, primary_key=True)
    factippag = db.Column(db.String(3))
    facdetalle = db.Column(db.String(1000))
    facfecven = db.Column(db.DateTime)
    facvalcuota = db.Column(db.Numeric(18, 2))
    facvalinter = db.Column(db.Numeric(18, 2))
    factotal = db.Column(db.Numeric(18, 2))
    facsalfin = db.Column(db.Numeric(18, 2))
    facvaladi = db.Column(db.Numeric(18, 2))
    pedfecisys = db.Column(db.DateTime)
    pedhorisys = db.Column(db.DateTime)
    pedusuisys = db.Column(db.String(10))
    pedestisys = db.Column(db.String(30))
    audnumxml = db.Column(db.String(18))


class FatpedcarproSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Fatpedcarpro
