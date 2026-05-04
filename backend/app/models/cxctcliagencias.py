from app.extensions import db
from app.extensions import ma


class Cxctcliagencias(db.Model):
    __tablename__ = "cxctcliagencias"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    clicodigo = db.Column(db.String(6), primary_key=True)
    agencodigo = db.Column(db.String(3))
    agendescri = db.Column(db.String(150))
    agendirec = db.Column(db.String(100))
    agentelef1 = db.Column(db.String(15))
    agentelef2 = db.Column(db.String(15))
    agenemail = db.Column(db.String(100))
    agenfecisys = db.Column(db.DateTime)
    agenhorisys = db.Column(db.DateTime)
    agenusuisys = db.Column(db.String(10))
    agenstatus = db.Column(db.String(30))
    zoncodigo = db.Column(db.String(3))
    regcodigo = db.Column(db.String(3))
    ciucodigo = db.Column(db.String(3))
    procodigo = db.Column(db.String(3))
    agentepref1 = db.Column(db.String(5))
    agentepref2 = db.Column(db.String(5))
    agentelext1 = db.Column(db.String(5))
    agentelext2 = db.Column(db.String(5))
    agecodrelext = db.Column(db.String(4))


class CxctcliagenciasSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Cxctcliagencias
