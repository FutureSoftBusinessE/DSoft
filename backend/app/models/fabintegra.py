# flake8: noqa
from app.extensions import db
from app.extensions import ma


class Fabintegra(db.Model):
    __tablename__ = "fabintegra"

    integracodigo = db.Column(db.String, primary_key=True)  # varchar
    integradescri = db.Column(db.String)  # varchar
    integradirecc = db.Column(db.String)  # varchar
    integrafono = db.Column(db.String)  # varchar
    integrastatus = db.Column(db.String)  # varchar
    integrafecisys = db.Column(db.DateTime)  # datetime
    integrahorisys = db.Column(db.DateTime)  # datetime
    integrausuisys = db.Column(db.String)  # varchar
    integraestisys = db.Column(db.String)  # varchar
    integrafecmsys = db.Column(db.DateTime)  # datetime
    integrahormsys = db.Column(db.DateTime)  # datetime
    integrausumsys = db.Column(db.String)  # varchar
    integraestmsys = db.Column(db.String)  # varchar
    integraruc = db.Column(db.String)  # varchar
    integraidentifica = db.Column(db.String)  # varchar
    integratipo = db.Column(db.String)  # varchar
    sectorcodigo = db.Column(db.String)  # varchar


class FapIntegraSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Fabintegra
