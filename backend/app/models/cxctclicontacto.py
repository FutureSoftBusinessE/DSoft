from app.extensions import db
from app.extensions import ma


class Cxctclicontactos(db.Model):
    __tablename__ = "cxctclicontactos"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    clicodigo = db.Column(db.String(6), primary_key=True)
    agencodigo = db.Column(db.String(3))
    condescri = db.Column(db.String(60))
    contelef1 = db.Column(db.String(15))
    contelef2 = db.Column(db.String(15))
    concelular = db.Column(db.String(15))
    conemail = db.Column(db.String(100))
    concomenta = db.Column(db.String(100))
    concargo = db.Column(db.String(100))
    areadescri = db.Column(db.String(60))
    confecisys = db.Column(db.DateTime)
    conhorisys = db.Column(db.DateTime)
    conusuisys = db.Column(db.String(10))
    constatus = db.Column(db.String(1))
    contelpref1 = db.Column(db.String(5))
    contelpref2 = db.Column(db.String(5))
    contelext1 = db.Column(db.String(5))
    contelext2 = db.Column(db.String(5))
    concodrelext = db.Column(db.String(4))
    convalviaje = db.Column(db.Numeric(9, 2))


class CxctclicontactosSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Cxctclicontactos
