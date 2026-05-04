# flake8: noqa
from app.extensions import db
from app.extensions import ma


class siacprintip(db.Model):
    __tablename__ = "siacprintip"

    ciacodigo = db.Column(db.String, primary_key=True)
    loccodigo = db.Column(db.String, primary_key=True)
    printproceso = db.Column(db.String, primary_key=True)
    lincodigo = db.Column(db.String, primary_key=True)
    printip = db.Column(db.String)
    printusuario = db.Column(db.String)
    printclave = db.Column(db.String)
    printfecisys = db.Column(db.DateTime)
    printhorisys = db.Column(db.DateTime)
    printusuisys = db.Column(db.String)
    printestisys = db.Column(db.String)
    printfecmsys = db.Column(db.DateTime)
    printhormsys = db.Column(db.DateTime)
    printusumsys = db.Column(db.String)
    printestmsys = db.Column(db.String)


class siacprintipSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siacprintip
