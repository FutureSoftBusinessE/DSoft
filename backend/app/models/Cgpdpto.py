# flake8: noqa
from app.extensions import db
from app.extensions import ma


class Cgpdpto(db.Model):
    __tablename__ = "Cgpdpto"

    ciacodigo = db.Column(db.String, primary_key=True)
    dptoanio = db.Column(db.Integer, primary_key=True)
    dptocodigo = db.Column(db.String, primary_key=True)
    dptodescri = db.Column(db.String)
    loccodigo = db.Column(db.String, primary_key=True)
    dptofecisys = db.Column(db.DateTime)
    dptofecmsys = db.Column(db.DateTime)
    dptohorisys = db.Column(db.DateTime)
    dptohormsys = db.Column(db.DateTime)
    dptonumsec = db.Column(db.Numeric)
    dptousuisys = db.Column(db.String)
    dptousumsys = db.Column(db.String)
    doccodigo = db.Column(db.String, primary_key=True)
    locservidor = db.Column(db.String, primary_key=True)


class CgpdptoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Cgpdpto
