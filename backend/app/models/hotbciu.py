from app.extensions import db
from app.extensions import ma


class Hotbciu(db.Model):
    __tablename__ = "hotbciu"

    ciucodigo = db.Column(db.String(3), primary_key=True)
    ciudescri = db.Column(db.String(50))
    ciustatus = db.Column(db.String(1))
    ciufecsys = db.Column(db.DateTime)
    ciuhorisys = db.Column(db.DateTime)
    ciuusuisys = db.Column(db.String(10))
    ciudinardap = db.Column(db.String(2))


class HotbciuSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Hotbciu
