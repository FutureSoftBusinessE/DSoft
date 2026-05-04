# flake8: noqa
from app.extensions import db
from app.extensions import ma


class sapcplantrega(db.Model):
    __tablename__ = "sapcplanentrega"
    __table_args__ = {"schema": "SIACSAP.dbo"}
    nro_Pedido = db.Column(db.String(50), primary_key=True)
    prv = db.Column(db.String(50))
    usr = db.Column(db.String(100))
    # idwms = db.Column(db.Numeric)
    estadoOrden = db.Column(db.String(10))
    fechaOrden = db.Column(db.String)
    horaOrden = db.Column(db.String)
    fechaRegistro = db.Column(db.String)
    horaRegistro = db.Column(db.String)
    bodegaOrden = db.Column(db.String(60))

    def __init__(self, nro_Pedido, prv, usr, estadoOrden, fechaOrden, horaOrden, fechaRegistro, horaRegistro, bodegaOrden):
        self.nro_Pedido = nro_Pedido
        self.prv = prv
        self.usr = usr
        # self.idwms = idwms
        self.estadoOrden = estadoOrden
        self.fechaOrden = fechaOrden
        self.horaOrden = horaOrden
        self.fechaRegistro = fechaRegistro
        self.horaRegistro = horaRegistro
        self.bodegaOrden = bodegaOrden


class sapcplantregaSchema(ma.Schema):
    class Meta:
        fields = (
            "nro_Pedido",
            "prv",
            "usr",
            "estadoOrden",
            "fechaOrden",
            "horaOrden",
            "fechaRegistro",
            "horaRegistro",
            "bodegaOrden",
        )


sapcplantrega_schema = sapcplantregaSchema()
sapcplantrega_schema_varios = sapcplantregaSchema(many=True)
