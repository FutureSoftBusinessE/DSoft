# flake8: noqa
from app.extensions import db
from app.extensions import ma


class Fatpedweb(db.Model):
    __tablename__ = "fatpedweb"

    ciacodigo = db.Column(db.String, primary_key=True)
    pednumped = db.Column(db.String, primary_key=True)
    loccodigo = db.Column(db.String, primary_key=True)
    vencodigo = db.Column(db.String)
    pedsecuen = db.Column(db.Integer, primary_key=True)
    pedfecemi = db.Column(db.DateTime)
    pedstatus = db.Column(db.String)
    invcodigo = db.Column(db.String)
    bodcodigo = db.Column(db.String)
    artcodigo = db.Column(db.String)
    artdescri = db.Column(db.String)
    pedapliiva = db.Column(db.Integer)
    pedcantidad = db.Column(db.Numeric)
    pedcantfacturado = db.Column(db.Numeric)
    pedpreven = db.Column(db.Numeric)
    pedpordesc = db.Column(db.Numeric)
    pedvaldesglo = db.Column(db.Numeric)
    pedvaldesc = db.Column(db.Numeric)
    pediva = db.Column(db.Numeric)
    pedvaliva = db.Column(db.Numeric)
    pedvalor = db.Column(db.Numeric)
    pedvaltot = db.Column(db.Numeric)
    pedfecisys = db.Column(db.DateTime)
    pedhorisys = db.Column(db.DateTime)
    pedusuisys = db.Column(db.String)
    pedestisys = db.Column(db.String)


class FatpedSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Fatpedweb
