# flake8: noqa
from app.extensions import db
from app.extensions import ma


class sapaentradamercaderia(db.Model):
    __tablename__ = "sapaentradamercaderia"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    id_men_legado = db.Column(db.String(50), primary_key=True)
    num_pedido = db.Column(db.String(50))
    cla_movimiento = db.Column(db.Integer)
    ind_sto_especial = db.Column(db.String(50))
    fec_documento = db.Column(db.String(50))
    not_entrega = db.Column(db.String(50))
    id_doc_legado = db.Column(db.String(50))
    num_posicion = db.Column(db.Integer)
    num_material = db.Column(db.String(50))
    cantidad = db.Column(db.Numeric)
    centro = db.Column(db.String(50))
    almacen = db.Column(db.String(50))
    lote = db.Column(db.String(50))
    cla_valoracion = db.Column(db.String(50))
    fec_vencimiento = db.Column(db.String(50))
    fec_env_wsdl = db.Column(db.String(50))
    idwmsInp = db.Column(db.String(50))
    fecharegistro = db.Column(db.String(50))
    usuarioregistro = db.Column(db.String(50))

    def __init__(
        self,
        id_men_legado,
        num_pedido,
        cla_movimiento,
        ind_sto_especial,
        fec_documento,
        not_entrega,
        id_doc_legado,
        num_posicion,
        num_material,
        cantidad,
        centro,
        almacen,
        lote,
        cla_valoracion,
        fec_vencimiento,
        fec_env_wsdl,
        idwmslnp,
        fecharegistro,
        usuarioregistro,
    ):
        self.id_men_legado = id_men_legado
        self.num_pedido = num_pedido
        self.cla_movimiento = cla_movimiento
        self.ind_sto_especial = ind_sto_especial
        self.fec_documento = fec_documento
        self.not_entrega = not_entrega
        self.id_doc_legado = id_doc_legado
        self.num_posicion = num_posicion
        self.num_material = num_material
        self.cantidad = cantidad
        self.centro = centro
        self.almacen = almacen
        self.lote = lote
        self.cla_valoracion = cla_valoracion
        self.fec_vencimiento = fec_vencimiento
        self.fec_env_wsdl = fec_env_wsdl
        self.idwmslnp = idwmslnp
        self.fecharegistro = fecharegistro
        self.usuarioregistro = usuarioregistro


class sapaentradamercaderiaSchema(ma.Schema):
    class Meta:
        fields = (
            "id_men_legado",
            "num_pedido",
            "cla_movimiento",
            "ind_sto_especial",
            "fec_documento",
            "not_entrega",
            "id_doc_legado",
            "num_posicion",
            "num_material",
            "cantidad",
            "centro",
            "almacen",
            "lote",
            "cla_valoracion",
            "fec_vencimiento",
            "fec_env_wsdl",
            "idwmslnp",
            "fecharegistro",
            "usuarioregistro",
        )


sapaentradamercaderia_schema = sapaentradamercaderiaSchema()
sapaentradamercaderia_schema_varios = sapaentradamercaderiaSchema(many=True)
