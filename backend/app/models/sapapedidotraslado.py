# flake8: noqa
import uuid
from app.extensions import db, ma
from marshmallow import fields, validate


class sapapedidotraslado(db.Model):
    __tablename__ = "sapapedidotraslado"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    idwmsInp = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fecharegistro = db.Column(db.DateTime)
    usuarioregistro = db.Column(db.String(50))
    Mensaje = db.Column(db.String(255))
    id_men_legado = db.Column(db.String(50))
    cla_pedido = db.Column(db.String(50))
    num_sol_ped = db.Column(db.String(50))
    id_doc_legado = db.Column(db.String(50))
    num_pos_sol_ped = db.Column(db.String(50))
    num_material = db.Column(db.String(50))
    cantidad = db.Column(db.Numeric)
    centro = db.Column(db.String(50))
    almacen = db.Column(db.String(50))
    lote = db.Column(db.String(50))
    cla_valoracion = db.Column(db.String(50))
    fec_env_wsdl = db.Column(db.DateTime)
    fec_vencimiento = db.Column(db.DateTime)

    def __init__(
        self,
        fecharegistro,
        usuarioregistro,
        Mensaje,
        id_men_legado,
        cla_pedido,
        num_sol_ped,
        id_doc_legado,
        num_pos_sol_ped,
        num_material,
        cantidad,
        centro,
        almacen,
        lote,
        cla_valoracion,
        fec_env_wsdl,
        fec_vencimiento,
    ):
        self.fecharegistro = fecharegistro
        self.usuarioregistro = usuarioregistro
        self.Mensaje = Mensaje
        self.id_men_legado = id_men_legado
        self.cla_pedido = cla_pedido
        self.num_sol_ped = num_sol_ped
        self.id_doc_legado = id_doc_legado
        self.num_pos_sol_ped = num_pos_sol_ped
        self.num_material = num_material
        self.cantidad = cantidad
        self.centro = centro
        self.almacen = almacen
        self.lote = lote
        self.cla_valoracion = cla_valoracion
        self.fec_env_wsdl = fec_env_wsdl
        self.fec_vencimiento = fec_vencimiento


class sapapedidotrasladoSchema(ma.Schema):
    class Meta:
        fields = (
            "idwmsInp",
            "fecharegistro",
            "usuarioregistro",
            "Mensaje",
            "id_men_legado",
            "cla_pedido",
            "num_sol_ped",
            "id_doc_legado",
            "num_pos_sol_ped",
            "num_material",
            "cantidad",
            "centro",
            "almacen",
            "lote",
            "cla_valoracion",
            "fec_env_wsdl",
            "fec_vencimiento",
        )


sap_a_pedido_traslado_schema = sapapedidotrasladoSchema()
sap_a_pedido_traslado_schema_varios = sapapedidotrasladoSchema(many=True)
