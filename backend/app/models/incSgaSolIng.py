# flake8: noqa
from app.extensions import db
from app.extensions import ma
from datetime import datetime, time, date


class incSgaSolIng(db.Model):
    __tablename__ = "incSgaSolIng"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    loccodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    sgasoling = db.Column(db.String(18), primary_key=True, nullable=False)
    sgaorigen = db.Column(db.String(10), nullable=False)
    sgagenepor = db.Column(db.String(10), nullable=False)
    sgadescri = db.Column(db.String(250), nullable=False)
    sgasolegr = db.Column(db.String(18))
    tranumero = db.Column(db.String(18))
    motcodigo = db.Column(db.String(3), nullable=False)
    sgafecsol = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    sgahorsol = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    sgaususol = db.Column(db.String(10), nullable=False)
    sgaestsol = db.Column(db.String(50), nullable=False)
    clicodigo = db.Column(db.String(6), nullable=False)
    procodigo = db.Column(db.String(6))
    sgafecllegada = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    sgahorllegada = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    sgacomenllegada = db.Column(db.String(250))
    sgaulttranumrecep = db.Column(db.String(18))
    sgaultfecrecep = db.Column(db.DateTime)
    sgaulthorrecep = db.Column(db.DateTime)
    sgaultusurecep = db.Column(db.String(10))
    sgaultestrecep = db.Column(db.String(50))
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

    sgafecmsys = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    sgahormsys = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    sgausumsys = db.Column(db.String(10), nullable=False)
    sgaestmsys = db.Column(db.String(50), nullable=False)
    idwmsInp = db.Column(db.String(36))
    EBELN = db.Column(db.String(10))
    BWART = db.Column(db.String(3))
    SOBKZ = db.Column(db.String(1))
    BLDAT = db.Column(db.String(8))
    LFSNR = db.Column(db.String(16))
    BKTXT = db.Column(db.String(25))
    idwmsOut = db.Column(db.String(36))
    MBLNR = db.Column(db.String(10))
    WERKS = db.Column(db.String(4))
    BSART = db.Column(db.String(4))
    DED = db.Column(db.String(4))
    BOD = db.Column(db.String(4))
    MO = db.Column(db.String(50))
    US = db.Column(db.String(12))
    DESCMATERIAL = db.Column(db.String(300))
    IDPROVEEDOR = db.Column(db.String(10))
    NAMEPROVEEDOR = db.Column(db.String(300))
    idwms = db.Column(db.Numeric(18, 0))


class incSgaSolIngSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: incSgaSolIng
