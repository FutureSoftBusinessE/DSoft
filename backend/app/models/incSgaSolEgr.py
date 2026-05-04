# flake8: noqa
from app.extensions import db
from app.extensions import ma
from datetime import datetime


class IncSgaSolEgr(db.Model):
    __tablename__ = "incSgaSolEgr"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    loccodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    sgasolegr = db.Column(db.String(18), primary_key=True, nullable=False)
    sgaorigen = db.Column(db.String(10), nullable=False)
    sgagenepor = db.Column(db.String(5), nullable=False)
    sgadescri = db.Column(db.String(250), nullable=False)
    sgasoling = db.Column(db.String(18))
    tranumero = db.Column(db.String(18))
    motcodigo = db.Column(db.String(3), nullable=False)
    sgafecsol = db.Column(db.DateTime, nullable=False)
    sgahorsol = db.Column(db.DateTime, nullable=False)
    sgaususol = db.Column(db.String(10), nullable=False)
    sgaestsol = db.Column(db.String(50), nullable=False)
    clicodigo = db.Column(db.String(6), nullable=False)
    procodigo = db.Column(db.String(6))
    sgafecenvio = db.Column(db.DateTime, nullable=False)
    sgahorenvio = db.Column(db.DateTime, nullable=False)
    sgacomenenvio = db.Column(db.String(250))
    agencodigosol = db.Column(db.String(9))
    agecodrelextsol = db.Column(db.String(4))
    agencodigoenv = db.Column(db.String(3))
    agecodrelextsenv = db.Column(db.String(8))
    condescrienv = db.Column(db.String(60))
    concodrelextenv = db.Column(db.String(14))
    sgaulttranumrecep = db.Column(db.String(18))
    sgaultfecegr = db.Column(db.DateTime)
    sgaulthoregr = db.Column(db.DateTime)
    sgaultusuegr = db.Column(db.String(10))
    sgaultestegr = db.Column(db.String(50))
    sgastatus = db.Column(db.String(20))
    sgafecapro = db.Column(db.DateTime)
    sgahorapro = db.Column(db.DateTime)
    sgausuapro = db.Column(db.String(10))
    sgaestapro = db.Column(db.String(50))
    sgacomenapro = db.Column(db.String(250))
    sgafeccie = db.Column(db.DateTime)
    sgahorcie = db.Column(db.DateTime)
    sgausucie = db.Column(db.String(10))
    sgaestcie = db.Column(db.String(50))
    sgacomencie = db.Column(db.String(250))
    sgafecmsys = db.Column(db.DateTime, nullable=False)
    sgahormsys = db.Column(db.DateTime, nullable=False)
    sgausumsys = db.Column(db.String(10), nullable=False)
    sgaestmsys = db.Column(db.String(50), nullable=False)
    sgausumsys = db.Column(db.String(10))
    sgaestmsys = db.Column(db.String(50))
    idwmsInp = db.Column(db.String(36))
    WERKS = db.Column(db.String(4))
    BSART = db.Column(db.String(4))
    BANFN = db.Column(db.String(10))
    DED = db.Column(db.String(4))
    BOD = db.Column(db.String(4))
    MO = db.Column(db.String(50))
    US = db.Column(db.String(12))
    BLDAT = db.Column(db.Date)
    MBLNR = db.Column(db.String(10))
    idwms = db.Column(db.Numeric(18, 0))


class IncSgaSolEgrSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = IncSgaSolEgr
