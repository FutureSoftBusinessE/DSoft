# flake8: noqa
from app.extensions import db
from app.extensions import ma


class Cxcbformapag(db.Model):
    __tablename__ = "cxcbformapag"
    ciacodigo = db.Column(db.String(2), primary_key=True)
    factippag = db.Column(db.String(3), primary_key=True)
    fordescri = db.Column(db.String(40), nullable=False)
    fordias = db.Column(db.Numeric(18, 2), nullable=False)
    fortipo = db.Column(db.String(2), nullable=False)
    forcuotas = db.Column(db.Integer, nullable=False)
    forstatus = db.Column(db.String(1), nullable=False)
    forfecisys = db.Column(db.DateTime, nullable=False)
    forhorisys = db.Column(db.DateTime, nullable=False)
    forusuisys = db.Column(db.String(10), nullable=False)
    forfecmsys = db.Column(db.DateTime, nullable=False)
    forhormsys = db.Column(db.DateTime, nullable=False)
    forusumsys = db.Column(db.String(10), nullable=False)
    foranticipo = db.Column(db.Numeric(6, 2), nullable=False)
    forintmen = db.Column(db.Numeric(6, 2), nullable=False)
    fordocgen = db.Column(db.String(1))
    foraplianti = db.Column(db.Integer, nullable=False, default=0)
    foraplirango = db.Column(db.Integer, nullable=False, default=0)
    formondesde = db.Column(db.Numeric(16, 2), nullable=False, default=0)
    formonhasta = db.Column(db.Numeric(16, 2), nullable=False, default=0)
    forapligrac = db.Column(db.Integer, nullable=False, default=0)
    fordiasgrac = db.Column(db.Integer, nullable=False, default=0)
    forcuoinigr = db.Column(db.Integer, nullable=False, default=0)
    forguiarem = db.Column(db.Integer, nullable=False, default=0)
    forcarven = db.Column(db.Integer, nullable=False, default=0)
    forprenda = db.Column(db.Integer, nullable=False, default=0)
    forcompnego = db.Column(db.Integer, nullable=False, default=0)
    forentrecep = db.Column(db.Integer, nullable=False, default=0)
    foruso = db.Column(db.String(1), nullable=False, default="F")
    forpromocion = db.Column(db.Integer, nullable=False, default=0)
    fordescuento = db.Column(db.Numeric(7, 2), nullable=False, default=0.00)
    forfecini = db.Column(db.DateTime)
    forhorini = db.Column(db.DateTime)
    forfecfin = db.Column(db.DateTime)
    forhorfin = db.Column(db.DateTime)
    forlistapv = db.Column(db.Integer, nullable=False, default=0)
    foraprocredito = db.Column(db.Integer, nullable=False, default=0)
    foraprologistica = db.Column(db.Integer, nullable=False, default=0)
    foraprocliente = db.Column(db.Integer, nullable=False, default=0)


class CxcbformapagSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Cxcbformapag
