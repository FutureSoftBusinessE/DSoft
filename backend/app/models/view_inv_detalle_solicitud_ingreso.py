# flake8: noqa
from app.extensions import db, ma


class view_inv_detalle_solicitud_ingreso(db.Model):
    __tablename__ = "view_inv_detalle_solicitud_ingreso"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    loccodigo = db.Column(db.String(10), primary_key=True)
    sgasoling = db.Column(db.String(10), primary_key=True)
    sgaorigen = db.Column(db.String(10))
    sgagenepor = db.Column(db.String(10))
    invcodigo = db.Column(db.String(10), primary_key=True)
    artcodigo = db.Column(db.String(10), primary_key=True)
    sgasecuen = db.Column(db.Integer, primary_key=True)
    sgacansol = db.Column(db.Integer)
    sgacanrec = db.Column(db.Integer)
    sgastatus = db.Column(db.String(10))
    sgaulttranumrecep = db.Column(db.String(10))
    sgaultfecrecep = db.Column(db.DateTime)
    sgaulthorrecep = db.Column(db.DateTime)
    sgaultusurecep = db.Column(db.String(10))
    sgaultestrecep = db.Column(db.String(50))
    sgafecsol = db.Column(db.DateTime)
    sgahorsol = db.Column(db.DateTime)
    sgaususol = db.Column(db.String(10))
    sgaestsol = db.Column(db.String(50))
    sgafecmsys = db.Column(db.DateTime)
    sgahormsys = db.Column(db.DateTime)
    sgausumsys = db.Column(db.String(10))
    sgaestmsys = db.Column(db.String(50))
    EBELP = db.Column(db.String(10))
    MATNR = db.Column(db.String(10))
    DETAIL_TAKE = db.Column(db.String(10))
    ERFMG = db.Column(db.Float)
    WERKS = db.Column(db.String(10))
    LGORT = db.Column(db.String(10))
    CHARG = db.Column(db.String(10))
    BWTAR = db.Column(db.String(10))
    UMVFDAT = db.Column(db.DateTime)
    artdescri = db.Column(db.String(100))
    artstatus = db.Column(db.String(10))
    artlote = db.Column(db.String(10))
    artserie = db.Column(db.String(10))
    artvalidaN1 = db.Column(db.String(10))


class view_inv_detalle_solicitud_ingreso_schema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = view_inv_detalle_solicitud_ingreso
