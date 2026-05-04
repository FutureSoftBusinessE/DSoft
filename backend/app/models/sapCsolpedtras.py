# flake8: noqa
from app.extensions import db
from app.extensions import ma


class sapCsolpedtras(db.Model):
    __tablename__ = "sapCsolpedtras"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    idwms = db.Column(db.Integer, autoincrement=True, primary_key=True)
    WERKS = db.Column(db.String(50))
    BSART = db.Column(db.String)
    BANFN = db.Column(db.String(50))
    DED = db.Column(db.String(50))
    BOD = db.Column(db.String(50))
    MO = db.Column(db.String(50))
    US = db.Column(db.String)
    ciacodigo = db.Column(db.String(50))
    loccodigo = db.Column(db.String)
    sgasolegr = db.Column(db.String(50))
    idwmsInp = db.Column(db.String(50))

    def __init__(self, idwmsInp, WERKS, BSART, BANFN, DED, BOD, MO, US, ciacodigo, loccodigo, sgasolegr):
        self.idwmsInp = idwmsInp
        self.WERKS = WERKS
        self.BSART = BSART
        self.BANFN = BANFN
        self.DED = DED
        self.BOD = BOD
        self.MO = MO
        self.US = US
        self.ciacodigo = ciacodigo
        self.loccodigo = loccodigo
        self.sgasolegr = sgasolegr
        # self.idwms = idwms


class sapCsolpedtrasSchema(ma.Schema):
    class Meta:
        fields = (
            "idwmsInp",
            "WERKS",
            "BSART",
            "BANFN",
            "DED",
            "BOD",
            "MO",
            "US",
            "ciacodigo",
            "loccodigo",
            "sgasolegr",
            "idwms",
        )


sapCsolpedtras_schema = sapCsolpedtrasSchema()
sapCsolpedtras_schema_varios = sapCsolpedtrasSchema(many=True)
