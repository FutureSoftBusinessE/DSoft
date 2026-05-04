# flake8: noqa
from app.extensions import db
from app.extensions import ma


class sapTsolpedtras(db.Model):
    __tablename__ = "sapTsolpedtras"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    idwmsInp = db.Column(db.String(100), primary_key=True)
    BNFPO = db.Column(db.Integer(), primary_key=True)
    MATNR = db.Column(db.String(), primary_key=True)
    MENGE = db.Column(db.String)
    LIFNR = db.Column(db.String(50))
    Fecha_Pedido = db.Column(db.Date)

    def __init__(self, idwmsInp, BNFPO, MATNR, MENGE, LIFNR, Fecha_Pedido):
        self.idwmsInp = idwmsInp
        self.BNFPO = BNFPO
        self.MATNR = MATNR
        self.MENGE = MENGE
        self.BANFN = LIFNR
        self.Fecha_Pedido = Fecha_Pedido


class sapTsolpedtrasSchema(ma.Schema):
    class Meta:
        fields = (
            "idwmsInp",
            "BNFPO",
            "MATNR",
            "MENGE",
            "LIFNR",
            "Fecha_Pedido",
        )


sapTsolpedtras_schema = sapTsolpedtrasSchema()
sapTsolpedtras_schema_varios = sapTsolpedtrasSchema(many=True)
