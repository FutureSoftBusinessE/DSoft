# flake8: noqa
from app.extensions import db, ma


class inbBahia(db.Model):
    __tablename__ = "inbbahia"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    bodcodigo = db.Column(db.String(3), primary_key=True)
    bahcodigo = db.Column(db.String(10), primary_key=True)
    bahdescripcion = db.Column(db.String(60), nullable=False)
    bahmetros3 = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    bahfecisys = db.Column(db.DateTime, nullable=False)
    bahhorisys = db.Column(db.DateTime, nullable=False)
    bahusuisys = db.Column(db.String(10), nullable=False)
    bahestisys = db.Column(db.String(50), nullable=False)
    bahfecmsys = db.Column(db.DateTime, nullable=False)
    bahhormsys = db.Column(db.DateTime, nullable=False)
    bahusumsys = db.Column(db.String(10), nullable=False)
    bahestmsys = db.Column(db.String(50), nullable=False)
    bahstatus = db.Column(db.String(1), nullable=False, default="A")
    izoncodigo = db.Column(db.String(10), nullable=False)
    pascodigo = db.Column(db.String(10), nullable=False)
    bahclasi = db.Column(db.String(50), nullable=False, default="ZIN CLASI")


class inbBahiaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbBahia
