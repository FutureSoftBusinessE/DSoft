# flake8: noqa
from app.extensions import db
from app.extensions import ma


class inbtono(db.Model):
    __tablename__ = "inbtono"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    toncodigo = db.Column(db.String(10), primary_key=True)
    tondescripcion = db.Column(db.String(60), nullable=False)
    tonfecisys = db.Column(db.DateTime, nullable=False)
    tonhorisys = db.Column(db.DateTime, nullable=False)
    tonusuisys = db.Column(db.String(10), nullable=False)
    tonestisys = db.Column(db.String(50), nullable=False)
    tonfecmsys = db.Column(db.DateTime, nullable=False)
    tonhormsys = db.Column(db.DateTime, nullable=False)
    tonusumsys = db.Column(db.String(10), nullable=False)
    tonestmsys = db.Column(db.String(50), nullable=False)
    tonstatus = db.Column(db.String(1), nullable=False, default="A")


class inbtonoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbtono
