# flake8: noqa
from app.extensions import db
from app.extensions import ma


class ViewBcoWebEstadoctasaldos(db.Model):
    __tablename__ = "view_bco_web_estadoctasaldos"

    Registro = db.Column(db.Integer, primary_key=True)
    ciacodigo = db.Column(db.String)
    bcocodigo = db.Column(db.String)
    bcodescri = db.Column(db.String)
    bcocta = db.Column(db.String)
    bcotipcta = db.Column(db.String)
    bcoultche = db.Column(db.String)
    tranfecha = db.Column(db.DateTime)
    tranhorisys = db.Column(db.DateTime)
    tranumbco = db.Column(db.String)
    ttrcodigo = db.Column(db.String)
    trandescri = db.Column(db.String)
    trannumedoc = db.Column(db.String)
    tranvalor = db.Column(db.Float)
    SaldoActualBco = db.Column(db.Float)

    def __init__(
        self,
        Registro,
        ciacodigo,
        bcocodigo,
        bcodescri,
        bcocta,
        bcotipcta,
        bcoultche,
        tranfecha,
        tranhorisys,
        tranumbco,
        ttrcodigo,
        trandescri,
        trannumedoc,
        tranvalor,
        SaldoActualBco,
    ):
        self.Registro = Registro
        self.ciacodigo = ciacodigo
        self.bcocodigo = bcocodigo
        self.bcodescri = bcodescri
        self.bcocta = bcocta
        self.bcotipcta = bcotipcta
        self.bcoultche = bcoultche
        self.tranfecha = tranfecha
        self.tranhorisys = tranhorisys
        self.tranumbco = tranumbco
        self.ttrcodigo = ttrcodigo
        self.trandescri = trandescri
        self.trannumedoc = trannumedoc
        self.tranvalor = tranvalor
        self.SaldoActualBco = SaldoActualBco


class ViewBcoWebEstadoctasaldosSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ViewBcoWebEstadoctasaldos
