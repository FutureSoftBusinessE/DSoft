# flake8: noqa
from app.extensions import db, ma

from app.extensions import db


class intartloteconfirma(db.Model):
    __tablename__ = "intartloteconfirma"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    tranumero = db.Column(db.String(18), primary_key=True)
    facsecuen = db.Column(db.Integer, primary_key=True)
    trasecconfirma = db.Column(db.Integer, primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    bodcodigo = db.Column(db.String(3), primary_key=True)
    artcodigo = db.Column(db.String(15), primary_key=True)
    artlote = db.Column(db.String(50), primary_key=True)
    artfecfab = db.Column(db.DateTime, nullable=False)
    artfecven = db.Column(db.DateTime, nullable=False)
    lotestatus = db.Column(db.String(1), nullable=False)
    artcantconfirmar = db.Column(db.Numeric(18, 6), nullable=False)
    artcantconvertconfirmar = db.Column(db.Numeric(18, 6), nullable=False)
    artcantlote = db.Column(db.Numeric(12, 2), nullable=False)
    lotecantconver = db.Column(db.Numeric(18, 6), nullable=False)
    bahcodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    nivcodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    embcodigo = db.Column(db.String(10))
    toncodigo = db.Column(db.String(10))
    izoncodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    pascodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    poscodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    artvalidaN1Fec = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    artvalidaN1Hor = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    artvalidaN1Usu = db.Column(db.String(10), nullable=False)
    artvalidaN1Est = db.Column(db.String(50), nullable=False)
    acccodigo = db.Column(db.String(15), primary_key=True, nullable=False)
    accion = db.Column(db.String(15), nullable=False)


class intartloteconfirmaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: intartloteconfirma
