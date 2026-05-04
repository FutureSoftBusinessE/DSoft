from app.extensions import db
from app.extensions import ma


class Fapzona(db.Model):
    __tablename__ = "fapzona"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    zoncodigo = db.Column(db.String(3), primary_key=True)
    zondescri = db.Column(db.String(40))
    zonstatus = db.Column(db.String(1))
    zonfecisys = db.Column(db.DateTime)
    zonhorisys = db.Column(db.DateTime)
    zonusuisys = db.Column(db.String(10))
    zonestsisys = db.Column(db.String(30))
    zonfecmsys = db.Column(db.DateTime)
    zonhormsys = db.Column(db.DateTime)
    zonusumsys = db.Column(db.String(10))
    zonestsmsys = db.Column(db.String(30))


class FapzonaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Fapzona
