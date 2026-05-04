# flake8: noqa
from app.extensions import db, ma


class intartlote(db.Model):
    __tablename__ = "intartlote"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    tranumero = db.Column(db.String(18), primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    artcodigo = db.Column(db.String(15), primary_key=True)
    bodcodigo = db.Column(db.String(3), primary_key=True)
    lotenumero = db.Column(db.String(60), primary_key=True)
    lotecantidad = db.Column(db.Numeric(18, 6), nullable=False)
    lotecantconver = db.Column(db.Numeric(18, 6), default=0)
    loterefern1 = db.Column(db.String(18))
    loterefern2 = db.Column(db.String(18))
    loterefern3 = db.Column(db.String(18))
    lotereferfec = db.Column(db.DateTime)
    clicodigo = db.Column(db.String(6))
    procodigo = db.Column(db.String(6))
    loteaccion = db.Column(db.String(15))
    lotestatus = db.Column(db.String(1), nullable=False)
    lotefecisys = db.Column(db.DateTime, nullable=False)
    lotehorisys = db.Column(db.DateTime, nullable=False)
    loteusuisys = db.Column(db.String(20), nullable=False)
    loteestisys = db.Column(db.String(50))
    facsecuen = db.Column(db.Integer, nullable=False, default=0)
    audnumxml = db.Column(db.String(13))
    audnumxmltrans = db.Column(db.String(18))
    lotesigno = db.Column(db.String(1))
    artfecfab = db.Column(db.DateTime)
    artfecven = db.Column(db.DateTime)
    bahcodigo = db.Column(db.String(10), nullable=False)
    nivcodigo = db.Column(db.String(10), nullable=False)
    embcodigo = db.Column(db.String(10), nullable=False)
    toncodigo = db.Column(db.String(10), nullable=False)
    izoncodigo = db.Column(db.String(10), nullable=False)
    pascodigo = db.Column(db.String(10), nullable=False)
    poscodigo = db.Column(db.String(10), nullable=False)
    artcantconfirmar = db.Column(db.Numeric(18, 6))
    artvalidaN1Fec = db.Column(db.DateTime)
    artvalidaN1Hor = db.Column(db.DateTime)
    artvalidaN1Usu = db.Column(db.String(10))
    artvalidaN1Est = db.Column(db.String(50))
    artvalidaN1InvAnt = db.Column(db.String(2))
    artvalidaN1BodAnt = db.Column(db.String(3))
    artvalidaN1izonAnt = db.Column(db.String(10))
    artvalidaN1pasAnt = db.Column(db.String(10))
    artvalidaN1bahAnt = db.Column(db.String(10))
    artvalidaN1posAnt = db.Column(db.String(10))
    artvalidaN1nivAnt = db.Column(db.String(10))
    artvalidaN1embAnt = db.Column(db.String(10))
    artvalidaN1tonAnt = db.Column(db.String(10))
    embpieza = db.Column(db.Integer, nullable=False, default=0)
    embmetros2 = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    embmetros3 = db.Column(db.Numeric(18, 2))
    artcantconvertconfirmar = db.Column(db.Numeric(18, 6), nullable=False, default=0)
    palletid = db.Column(db.String(18))


class intartloteSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: intartlote
