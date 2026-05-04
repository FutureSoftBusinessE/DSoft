# flake8: noqa
from app.extensions import db
from app.extensions import ma


class Fabproyecto(db.Model):
    __tablename__ = "fabproyecto"

    proyectocodigo = db.Column(db.String, primary_key=True)  # varchar
    proyectodescri = db.Column(db.String)  # varchar
    proyectodirecc = db.Column(db.String)  # varchar
    proyectofono = db.Column(db.String)  # varchar
    proyectostatus = db.Column(db.String)  # varchar
    proyectofecisys = db.Column(db.DateTime)  # datetime
    proyectohorisys = db.Column(db.DateTime)  # datetime
    proyectousuisys = db.Column(db.String)  # varchar
    proyectoestisys = db.Column(db.String)  # varchar
    proyectofecmsys = db.Column(db.DateTime)  # datetime
    proyectohormsys = db.Column(db.DateTime)  # datetime
    proyectousumsys = db.Column(db.String)  # varchar
    proyectoestmsys = db.Column(db.String)  # varchar
    profecini = db.Column(db.DateTime)  # datetime
    profefin = db.Column(db.DateTime)  # datetime
    camcodigo = db.Column(db.String)  # varchar
    clicodigo = db.Column(db.String)  # varchar
    contactoCodigo = db.Column(db.String)  # varchar
    competencia = db.Column(db.String)  # varchar
    integrador = db.Column(db.String)  # varchar
    pronumpunto = db.Column(db.Numeric)  # decimal


class FapproyectoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Fabproyecto
