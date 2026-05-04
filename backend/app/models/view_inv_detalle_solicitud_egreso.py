from app.extensions import db
from app.extensions import ma


class view_inv_detalle_solicitud_egreso(db.Model):
    __tablename__ = "view_inv_detalle_solicitud_egreso"

    ciacodigo = db.Column(db.String, primary_key=True)
    loccodigo = db.Column(db.String, primary_key=True)
    sgasolegr = db.Column(db.String, primary_key=True)
    sgaorigen = db.Column(db.String)
    sgagenepor = db.Column(db.String)
    invcodigo = db.Column(db.String(10), nullable=False)
    artcodigo = db.Column(db.String(8))
    sgasecuen = db.Column(db.Integer, nullable=False, default=0)
    sgacansol = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    sgacanegr = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    sgastatus = db.Column(db.String(10))
    sgaulttranumegr = db.Column(db.String(18))
    sgaultfecegr = db.Column(db.DateTime)
    sgaulthoregr = db.Column(db.DateTime)
    sgaultusuegr = db.Column(db.String(10))
    sgaultestegr = db.Column(db.String(50))
    sgafecsol = db.Column(db.DateTime, nullable=False)
    sgahorsol = db.Column(db.DateTime, nullable=False)
    sgaestsol = db.Column(db.String(50), nullable=False)
    sgaususol = db.Column(db.String(10), nullable=False)
    sgausumsys = db.Column(db.String(10), nullable=False)
    sgahormsys = db.Column(db.DateTime, nullable=False)
    sgafecmsys = db.Column(db.DateTime, nullable=False)
    sgaestmsys = db.Column(db.String(50), nullable=False)
    BNFPO = db.Column(db.Numeric(18, 0))
    MATNR = db.Column(db.String(18), nullable=False)
    MENGE = db.Column(db.Numeric(18, 3), nullable=False)
    LIFNR = db.Column(db.String(10))
    ZEILE = db.Column(db.Numeric(18, 0))
    CHARG = db.Column(db.String(10))
    PRV = db.Column(db.String(35))
    artdescri = db.Column(db.String(300))
    artstatus = db.Column(db.String(1))
    artlote = db.Column(db.Integer)
    artserie = db.Column(db.Integer)
    sgacansolpicking = db.Column(db.Numeric(9, 2))
    sgacanpicking = db.Column(db.Numeric(9, 2))
    sgacanciepicking = db.Column(db.Numeric(9, 2))
    sgacansalpicking = db.Column(db.Numeric(9, 2))


class view_inv_detalle_solicitud_egreso_schema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = view_inv_detalle_solicitud_egreso
