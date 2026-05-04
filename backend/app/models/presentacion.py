# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class Presentacion(db.Model):
    __tablename__ = "inbpre"

    ciacodigo = db.Column(db.String)
    precodigo = db.Column(db.String)
    predescri = db.Column(db.String)
    prestatus = db.Column(db.String)
    prefecisys = db.Column(db.DateTime)
    prehorisys = db.Column(db.DateTime)
    preusuisys = db.Column(db.String)
    prefecmsys = db.Column(db.DateTime)
    prehormsys = db.Column(db.DateTime)
    preusumsys = db.Column(db.String)

    __table_args__ = (PrimaryKeyConstraint("ciacodigo", "precodigo", name="pk_inbpre"),)


class PresentacionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: Presentacion
