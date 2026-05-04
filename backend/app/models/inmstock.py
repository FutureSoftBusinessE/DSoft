# flake8: noqa
from app.extensions import db, ma


class inmstock(db.Model):
    __tablename__ = "inmstock"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    artcodigo = db.Column(db.String(15), primary_key=True)
    bodcodigo = db.Column(db.String(3), primary_key=True)
    precodigo = db.Column(db.String(2), nullable=False)
    preorden = db.Column(db.Integer, nullable=False)
    preequivale = db.Column(db.Integer, nullable=False)
    medcodigo = db.Column(db.String(3), nullable=False)
    prepeso = db.Column(db.Numeric(18, 2))
    prebasica = db.Column(db.Integer, nullable=False, default=0)
    stokstatus = db.Column(db.String(1), nullable=False)
    stokinicial = db.Column(db.Numeric(18, 6), nullable=False)
    stokactual = db.Column(db.Numeric(18, 6), nullable=False)
    stokfecisys = db.Column(db.DateTime, nullable=False)
    stokhorisys = db.Column(db.DateTime, nullable=False)
    stokusuisys = db.Column(db.String(10), nullable=False)
    stokfecmsys = db.Column(db.DateTime, nullable=False)
    stokhormsys = db.Column(db.DateTime, nullable=False)
    stokusumsys = db.Column(db.String(10), nullable=False)
    artpercha = db.Column(db.String(60))
    stocknimimo = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    stockmaximo = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    stockdiasrep = db.Column(db.Integer, nullable=False, default=0)
    stockfecemail = db.Column(db.DateTime)
    stockemail = db.Column(db.String(50))
    procodigo = db.Column(db.String(6))
    stokestisys = db.Column(db.String(50), nullable=False, default="")
    stokestmsys = db.Column(db.String(50), nullable=False, default="")
    fecenvioxml = db.Column(db.DateTime)
    artstockporent = db.Column(db.Numeric(20, 5), nullable=False, default=0)
    stokcostoactual = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    stokcostoactdol = db.Column(db.Numeric(18, 8), nullable=False, default=0)


class inmstockSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: inmstock
