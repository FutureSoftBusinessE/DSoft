# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class Linea(db.Model):
    __tablename__ = "inblin"

    ciacodigo = db.Column(db.String, primary_key=True)
    lincodigo = db.Column(db.String, primary_key=True)
    lindescri = db.Column(db.String)
    linlindes = db.Column(db.String)
    coscodigo = db.Column(db.String)
    linnivel = db.Column(db.Integer)
    lintipo = db.Column(db.String)
    linstatus = db.Column(db.String)
    linfecisys = db.Column(db.DateTime)
    linhorisys = db.Column(db.DateTime)
    linusuisys = db.Column(db.String)
    linfecmsys = db.Column(db.DateTime)
    linhormsys = db.Column(db.DateTime)
    linusumsys = db.Column(db.String)
    numsecini = db.Column(db.Integer)
    numseccont = db.Column(db.Integer)
    lincodigo1 = db.Column(db.String)


# class ProductoSchema(ma.SQLAlchemyAutoSchema):
#     class Meta:
#         model: Linea


class LineaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: Linea
