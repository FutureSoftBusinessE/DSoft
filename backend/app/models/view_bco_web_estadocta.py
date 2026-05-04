# flake8: noqa
from app.extensions import db
from app.extensions import ma


class ViewBcoWebEstadocta(db.Model):
    __tablename__ = "view_bco_web_estadocta"

    ciacodigo = db.Column(db.String, primary_key=True)
    bcocodigo = db.Column(db.String, primary_key=True)
    bcodescri = db.Column(db.String)
    bcocta = db.Column(db.String, primary_key=True)
    bcotipcta = db.Column(db.String)
    bcoultche = db.Column(db.String)
    tranfecha = db.Column(db.DateTime)
    tranhorisys = db.Column(db.DateTime)
    tranumbco = db.Column(db.String)
    ttrcodigo = db.Column(db.String)
    trandescri = db.Column(db.String)
    trannumedoc = db.Column(db.String)
    tranvalor = db.Column(db.Float)


class ViewBcoWebEstadoctaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ViewBcoWebEstadocta
