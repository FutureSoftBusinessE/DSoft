# flake8: noqa
from app.extensions import db
from app.extensions import ma


class saptplantrega(db.Model):
    __tablename__ = "saptplanentrega"
    __table_args__ = {"schema": "SIACSAP.dbo"}
    nro_Pedido = db.Column(db.String(50), primary_key=True)
    mat = db.Column(db.String(50))
    ca = db.Column(db.Numeric)
    lin = db.Column(db.Integer)
    fent = db.Column(db.String(50))
    hent = db.Column(db.String(50))
    hfin = db.Column(db.String(50))
    caent = db.Column(db.Numeric)
    caxent = db.Column(db.Numeric)
    est = db.Column(db.String(1))
    # ciacodigo = db.Column(db.String(2))
    # loccodigo = db.Column(db.String(2))
    # sgasoling = db.Column(db.String(18))
    fechaRegistro = db.Column(db.DateTime)
    horaRegistro = db.Column(db.DateTime)
    # ciacodigo1 = db.Column(db.String(2))
    # loccodigo1 = db.Column(db.String(2))
    # sgasoling1 = db.Column(db.String(18))

    def __init__(
        self,
        nro_Pedido,
        mat,
        ca,
        lin,
        fent,
        hent,
        hfin,
        caent,
        caxent,
        est
        #  ,ciacodigo,loccodigo,sgasoling,
        ,
        fechaRegistro,
        horaRegistro,
        #  ,ciacodigo1,loccodigo1,sgasoling1
    ):
        self.nro_Pedido = nro_Pedido
        self.mat = mat
        self.ca = ca
        self.lin = lin
        self.fent = fent
        self.hent = hent
        self.hfin = hfin
        self.caent = caent
        self.caxent = caxent
        self.est = est
        # self.ciacodigo = ciacodigo
        # self.loccodigo = loccodigo
        # self.sgasoling = sgasoling
        self.fechaRegistro = fechaRegistro
        self.horaRegistro = horaRegistro
        # self.ciacodigo1 = ciacodigo1
        # self.loccodigo1 = loccodigo1
        # self.sgasoling1 = sgasoling1


class saptplantregaSchema(ma.Schema):
    class Meta:
        fields = (
            "nro_Pedido",
            "mat",
            "ca",
            "lin",
            "fent",
            "hent",
            "hfin",
            "caent",
            "caxent",
            "est",
            # 'ciacodigo',
            # 'loccodigo',
            # 'sgasoling',
            "fechaRegisto",
            "horaRegistro",
            # 'ciacodigo1',
            # 'loccodigo1',
            # 'sgasoling1',
        )


saptplantrega_schema = saptplantregaSchema()
saptplantrega_schema_varios = saptplantregaSchema(many=True)
