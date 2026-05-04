# flake8: noqa
from app.extensions import db, ma
from marshmallow import fields, validate


class SapAEgresoPedTraslado(db.Model):
    __tablename__ = "sapAEgresoPedTraslado"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    id_men_legado = db.Column(db.String(50), primary_key=True)
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
    idt = db.Column(db.Integer)

    def __init__(
        self,
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
        idt,
    ):
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
        self.idt = idt


class SapAEgresoPedTrasladoSchema(ma.Schema):
    id_men_legado = fields.String(validate=validate.Length(max=50))
    cla_pedido = fields.String(validate=validate.Length(max=50))
    num_sol_ped = fields.String(validate=validate.Length(max=50))
    id_doc_legado = fields.String(validate=validate.Length(max=50))
    num_pos_sol_ped = fields.String(validate=validate.Length(max=50))
    num_material = fields.String(validate=validate.Length(max=50))
    cantidad = fields.Decimal()
    centro = fields.String(validate=validate.Length(max=50))
    almacen = fields.String(validate=validate.Length(max=50))
    lote = fields.String(validate=validate.Length(max=50))
    cla_valoracion = fields.String(validate=validate.Length(max=50))
    fec_env_wsdl = fields.DateTime()
    idt = fields.Integer()


sap_a_egreso_ped_traslado_schema = SapAEgresoPedTrasladoSchema()
sap_a_egreso_ped_traslado_schema_varios = SapAEgresoPedTrasladoSchema(many=True)
