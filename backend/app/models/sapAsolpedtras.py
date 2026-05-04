# flake8: noqa
from app.extensions import db
from app.extensions import ma


class sapAsolpedtras(db.Model):
    __tablename__ = "sapAsolpedtras"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    idwmsInp = db.Column(db.String(50), primary_key=True)
    fecharegistro = db.Column(db.String(50), primary_key=True)
    usuarioregistro = db.Column(db.String(50), primary_key=True)
    mensaje = db.Column(db.String(50))
    BANFN = db.Column(db.String(50))
    DED = db.Column(db.String(50))
    BOD = db.Column(db.String(50))
    BNFPO = db.Column(db.Integer())
    MATNR = db.Column(db.String())

    def __init__(self, idwmsInp, fecharegistro, usuarioregistro, mensaje, BANFN, DED, BOD, BNFPO, MATNR):
        self.idwmsInp = idwmsInp
        self.fecharegistro = fecharegistro
        self.usuarioregistro = usuarioregistro
        self.mensaje = mensaje
        self.BANFN = BANFN
        self.DED = DED
        self.BOD = BOD
        self.BNFPO = BNFPO
        self.MATNR = MATNR


class SapAsolpedtrasSchema(ma.Schema):
    class Meta:
        fields = ("idwmsInp", "fecharegistro", "usuarioregistro", "mensaje", "BANFN", "DED", "BOD", "BNFPO", "MATNR")


sapAsolpedtras_schema = SapAsolpedtrasSchema()
sapAsolpedtras_schemas = SapAsolpedtrasSchema(many=True)
