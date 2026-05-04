# flake8: noqa
from app.extensions import db, ma


class incart(db.Model):
    __tablename__ = "incart"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    tranumero = db.Column(db.String(18), primary_key=True)
    tracompcon = db.Column(db.String(18))
    trafecha = db.Column(db.DateTime, nullable=False)
    trafecven = db.Column(db.DateTime)
    trahora = db.Column(db.DateTime, nullable=False)
    tracodigo = db.Column(db.String(3), nullable=False)
    tratipo = db.Column(db.String(7), nullable=False)
    trametodo = db.Column(db.Integer, nullable=False)
    traorigen = db.Column(db.String(3), nullable=False)
    ordnumero = db.Column(db.String(18))
    tradocumento = db.Column(db.String(18), nullable=False, default="")
    tradescripcion = db.Column(db.String(255), nullable=False)
    clicodigo = db.Column(db.String(6))
    invcodigo = db.Column(db.String(2), nullable=False)
    bodcodigo = db.Column(db.String(3), nullable=False)
    tradato = db.Column(db.String(6))
    invcodtransing = db.Column(db.String(2))
    bodcodtransing = db.Column(db.String(3))
    invcodtransegr = db.Column(db.String(2))
    bodcodtransegr = db.Column(db.String(3))
    trastatus = db.Column(db.String(1), nullable=False)
    trafecisys = db.Column(db.DateTime, nullable=False)
    trahorisys = db.Column(db.DateTime, nullable=False)
    trausuisys = db.Column(db.String(10), nullable=False)
    trafecmsys = db.Column(db.DateTime, nullable=False)
    trahormsys = db.Column(db.DateTime, nullable=False)
    trausumsys = db.Column(db.String(120))
    pctacodigo = db.Column(db.String(30))
    notcodigo = db.Column(db.String(3))
    tratotal = db.Column(db.Numeric(18, 0), default=0)
    tracodciarel = db.Column(db.String(2))
    audnumxml = db.Column(db.String(18))
    audnumxmltrans = db.Column(db.String(18))
    horentrega = db.Column(db.Integer, nullable=False, default=0)
    facnumero = db.Column(db.String(25))


class incartSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: incart
