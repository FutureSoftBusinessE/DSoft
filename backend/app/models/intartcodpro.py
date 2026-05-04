# flake8: noqa
from app.extensions import db, ma


class intartcodpro(db.Model):
    __tablename__ = "intartcodpro"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    artcodigo = db.Column(db.String(15))
    procodigo = db.Column(db.String(6), primary_key=True)
    artcodigo2 = db.Column(db.String(100), primary_key=True)
    artfecmsys = db.Column(db.DateTime, nullable=False)
    arthormsys = db.Column(db.DateTime, nullable=False)
    artestmsys = db.Column(db.String(40), nullable=False)
    artusumsys = db.Column(db.String(10), nullable=False)
    artprecio = db.Column(db.Numeric(18, 2), nullable=True)


class intartcodproSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = intartcodpro
