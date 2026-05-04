# flake8: noqa
from app.extensions import db
from app.extensions import ma


class view_inmstock(db.Model):
    __tablename__ = "view_inmstock"

    ciacodigo = db.Column(db.String, primary_key=True)
    invcodigo = db.Column(db.String, primary_key=True)
    artcodigo = db.Column(db.String, primary_key=True)
    bodcodigo = db.Column(db.String, primary_key=True)
    stokstatus = db.Column(db.String)
    stokactual = db.Column(db.Numeric)
    artpercha = db.Column(db.String)
    stocknimimo = db.Column(db.Numeric)
    stockmaximo = db.Column(db.Numeric)
    stockdiasrep = db.Column(db.Integer)
    boddescri = db.Column(db.String)
    loccodigo = db.Column(db.String)
    locdescri = db.Column(db.String)


class view_inmstockSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = view_inmstock
