# flake8: noqa
from app.extensions import db
from app.extensions import ma
from datetime import datetime


class IntSgaSolEgr(db.Model):
    __tablename__ = "intSgaSolEgr"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    loccodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    sgasolegr = db.Column(db.String(18), primary_key=True, nullable=False)
    sgaorigen = db.Column(db.String(10), nullable=False)
    sgagenepor = db.Column(db.String(5), nullable=False)
    invcodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    artcodigo = db.Column(db.String(8), primary_key=True)
    sgasecuen = db.Column(db.Integer, primary_key=True, nullable=False, default=0)
    sgacansol = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    sgacanegr = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    sgastatus = db.Column(db.String(10))
    sgaulttranumegr = db.Column(db.String(18))
    sgaultfecegr = db.Column(db.DateTime)
    sgaulthoregr = db.Column(db.DateTime)
    sgaultusuegr = db.Column(db.String(10))
    sgaultestegr = db.Column(db.String(50))
    sgafecsol = db.Column(db.DateTime, nullable=False)
    sgahorsol = db.Column(db.DateTime, nullable=False)
    sgaestsol = db.Column(db.String(50), nullable=False)
    sgaususol = db.Column(db.String(10), nullable=False)
    sgausumsys = db.Column(db.String(10), nullable=False)
    sgahormsys = db.Column(db.DateTime, nullable=False)
    sgafecmsys = db.Column(db.DateTime, nullable=False)
    sgaestmsys = db.Column(db.String(50), nullable=False)
    BNFPO = db.Column(db.Numeric(18, 0))
    MATNR = db.Column(db.String(18), nullable=False)
    MENGE = db.Column(db.Numeric(18, 3), nullable=False)
    LIFNR = db.Column(db.String(10))
    ZEILE = db.Column(db.Numeric(18, 0))
    CHARG = db.Column(db.String(10))
    PRV = db.Column(db.String(35))
    sgacansolpicking = db.Column(db.Numeric(18, 2))
    sgacanpicking = db.Column(db.Numeric(18, 2))
    sgacanciepicking = db.Column(db.Numeric(18, 2))
    sgacansalpicking = db.Column(db.Numeric(18, 2))
    sgacanaumenta = db.Column(db.Numeric(18, 2))
    sgafecaumsys = db.Column(db.DateTime)
    sgahoraumsys = db.Column(db.DateTime)
    sgaestaumsys = db.Column(db.DateTime)


class IntSgaSolEgrSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = IntSgaSolEgr
