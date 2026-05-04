from app.extensions import db
from app.extensions import ma


class Cxcbreg(db.Model):
    __tablename__ = "cxcbreg"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    regcodigo = db.Column(db.String(3), primary_key=True)
    regdescri = db.Column(db.String(40))
    regstatus = db.Column(db.String(1))
    regfecisys = db.Column(db.DateTime)
    reghorisys = db.Column(db.DateTime)
    regusuisys = db.Column(db.String(10))
    regfecmsys = db.Column(db.DateTime)
    reghormsys = db.Column(db.DateTime)
    regusumsys = db.Column(db.String(10))


class CxcbregSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Cxcbreg
