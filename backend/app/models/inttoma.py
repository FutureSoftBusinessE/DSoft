from app.extensions import db
from app.extensions import ma


class Inttoma(db.Model):
    __tablename__ = "inttoma"

    ciacodigo = db.Column(db.String(2), nullable=False)
    tomnumero = db.Column(db.String(18), nullable=False)
    tomfecha = db.Column(db.DateTime, nullable=False)
    tomhora = db.Column(db.DateTime, nullable=False)
    tomusuario = db.Column(db.String(10), nullable=False)
    tomnumajuste = db.Column(db.String(18), nullable=True)
    tomfecajuste = db.Column(db.DateTime, nullable=True)
    tomhorajuste = db.Column(db.DateTime, nullable=True)
    tomusuajuste = db.Column(db.String(10), nullable=True)
    tomtipo = db.Column(db.String(7), nullable=False)
    tomstatus = db.Column(db.String(1), nullable=False)
    invcodigo = db.Column(db.String(2), nullable=False)
    artcodigo = db.Column(db.String(15), nullable=False)
    lincodigo = db.Column(db.String(20), nullable=False)
    bodcodigo = db.Column(db.String(3), nullable=False)
    precodigo = db.Column(db.String(2), nullable=False)
    preorden = db.Column(db.Integer, nullable=True)
    preequivale = db.Column(db.Integer, nullable=True)
    medcodigo = db.Column(db.String(3), nullable=False)
    prepeso = db.Column(db.Numeric(18, 2), nullable=True)
    prebasica = db.Column(db.Integer, nullable=True)
    tomsaldo = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomcosto = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomconteo1 = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomconteo2 = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomconteo3 = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomcostodol = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomreal = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomajuste = db.Column(db.Numeric(18, 8), nullable=False, default=0)
    tomfecisys = db.Column(db.DateTime, nullable=False)
    tomhorisys = db.Column(db.DateTime, nullable=False)
    tomusuisys = db.Column(db.String(10), nullable=False)
    tomfecmsys = db.Column(db.DateTime, nullable=False)
    tomhormsys = db.Column(db.DateTime, nullable=False)
    tomusumsys = db.Column(db.String(10), nullable=False)
    tomseq = db.Column(db.Numeric(12, 0), nullable=False, default=1)
    artpercha = db.Column(db.String(60), nullable=True)
    bahcodigo = db.Column(db.String(10), nullable=False)
    nivcodigo = db.Column(db.String(10), nullable=False)
    embcodigo = db.Column(db.String(10), nullable=False)
    toncodigo = db.Column(db.String(10), nullable=False)
    izoncodigo = db.Column(db.String(10), nullable=False)
    pascodigo = db.Column(db.String(10), nullable=False)
    poscodigo = db.Column(db.String(10), nullable=False)
    embpieza = db.Column(db.Integer, nullable=False, default=0)
    embmetro2 = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    embmetros3 = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    tipoloteserie = db.Column(db.String(5), nullable=False)
    numloteserie = db.Column(db.String(60), nullable=False)
    colcodigo = db.Column(db.String(3), nullable=True)
    serplaca = db.Column(db.String(15), nullable=True)
    sermotor = db.Column(db.String(60), nullable=True)
    serModAnio = db.Column(db.Integer, nullable=False, default=0)
    paiscodigo = db.Column(db.String(3), nullable=True)
    serram = db.Column(db.String(20), nullable=True)
    artfecfab = db.Column(db.DateTime, nullable=True)
    artfecven = db.Column(db.DateTime, nullable=True)
    tomsaldoconver = db.Column(db.Numeric(18, 8), nullable=False, default=0)

    __table_args__ = (
        db.PrimaryKeyConstraint(
            "ciacodigo",
            "tomnumero",
            "invcodigo",
            "bodcodigo",
            "artcodigo",
            "numloteserie",
            "bahcodigo",
            "nivcodigo",
            "izoncodigo",
            "pascodigo",
            "poscodigo",
            "embcodigo",
            "toncodigo",
            name="pk_inttoma",
        ),
    )


class Inttoma(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: Inttoma
