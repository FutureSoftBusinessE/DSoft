# flake8: noqa
from app.extensions import db, ma


class inmlote(db.Model):
    __tablename__ = "inmlote"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    bodcodigo = db.Column(db.String(3), primary_key=True)
    artcodigo = db.Column(db.String(15), primary_key=True)
    artlote = db.Column(db.String(50), primary_key=True)
    artfecfab = db.Column(db.DateTime, nullable=False)
    artfecven = db.Column(db.DateTime, nullable=False)
    artcantlote = db.Column(db.Numeric(12, 2), nullable=False)
    lotecantconver = db.Column(db.Numeric(18, 6), nullable=False, default=0)
    tranumero = db.Column(db.String(18))
    traultdoc = db.Column(db.String(18))
    bahcodigo = db.Column(db.String(10), primary_key=True)
    nivcodigo = db.Column(db.String(10), primary_key=True)
    embcodigo = db.Column(db.String(10), primary_key=True)
    toncodigo = db.Column(db.String(10), primary_key=True)
    izoncodigo = db.Column(db.String(10), primary_key=True)
    pascodigo = db.Column(db.String(10), primary_key=True)
    poscodigo = db.Column(db.String(10), primary_key=True)
    loteaccion = db.Column(db.String(15))
    artcantconfirmar = db.Column(db.Numeric(18, 6), nullable=False, default=0)
    artcantconvertconfirmar = db.Column(db.Numeric(18, 6), nullable=False, default=0)
    palletid = db.Column(db.String(18))


class inmloteSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: inmlote
