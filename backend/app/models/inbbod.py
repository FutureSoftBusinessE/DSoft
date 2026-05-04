# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class inbbod(db.Model):
    __tablename__ = "inbbod"
    ciacodigo = db.Column(db.String, primary_key=True)
    invcodigo = db.Column(db.String, primary_key=True)
    bodcodigo = db.Column(db.String, primary_key=True)
    boddescri = db.Column(db.String)
    bodstatus = db.Column(db.String)
    bodfecisys = db.Column(db.DateTime)
    bodhorisys = db.Column(db.DateTime)
    bodusuisys = db.Column(db.String)
    bodfecmsys = db.Column(db.DateTime)
    bodhormsys = db.Column(db.DateTime)
    bodusumsys = db.Column(db.String)
    bodserieblanco = db.Column(db.Integer)
    loccodigo = db.Column(db.String)


class inbbodSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbbod
