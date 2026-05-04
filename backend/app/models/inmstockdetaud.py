# flake8: noqa
from app.extensions import db
from app.extensions import ma
from datetime import datetime, time, date


class InmStockDetAud(db.Model):
    __tablename__ = "inmstockdetaud"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    invcodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    bodcodigo = db.Column(db.String(3), primary_key=True, nullable=False)
    artcodigo = db.Column(db.String(15), primary_key=True, nullable=False)
    izoncodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    bahcodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    pascodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    nivcodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    poscodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    embcodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    toncodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    palletid = db.Column(db.String(18), primary_key=True, nullable=False)
    stokdetcantidad = db.Column(db.Numeric(18, 6), nullable=False)
    stokdetcantconver = db.Column(db.Numeric(18, 6), nullable=False)
    stokdetstatus = db.Column(db.String(1), nullable=False)
    stokdetfecmsys = db.Column(db.DateTime, nullable=False)
    stokdethormsys = db.Column(db.DateTime, nullable=False)
    stokdetusumsys = db.Column(db.String(10), nullable=False)
    stokdetestmsys = db.Column(db.String(50), nullable=False)
    auddetfecmsys = db.Column(db.DateTime, default=lambda: datetime.combine(db.func.current_date(), time()), nullable=False)
    auddethormsys = db.Column(db.DateTime, default=lambda: datetime.combine(date(1900, 1, 1), datetime.now().time()), nullable=False)
    auddetusumsys = db.Column(db.String(10), nullable=False)
    auddetestmsys = db.Column(db.String(50), nullable=False)

    __table_args__ = (
        db.PrimaryKeyConstraint(
            "ciacodigo",
            "invcodigo",
            "bodcodigo",
            "artcodigo",
            "izoncodigo",
            "bahcodigo",
            "pascodigo",
            "nivcodigo",
            "poscodigo",
            "embcodigo",
            "toncodigo",
            "palletid",
        ),
    )


# Define foreign keys
db.ForeignKeyConstraint(
    ["ciacodigo", "invcodigo", "bodcodigo", "bahcodigo"],
    ["inbbahia.ciacodigo", "inbbahia.invcodigo", "inbbahia.bodcodigo", "inbbahia.bahcodigo"],
),
db.ForeignKeyConstraint(["ciacodigo", "invcodigo", "bodcodigo"], ["inbbod.ciacodigo", "inbbod.invcodigo", "inbbod.bodcodigo"]),
db.ForeignKeyConstraint(["ciacodigo", "embcodigo"], ["inbembalaje.ciacodigo", "inbembalaje.embcodigo"]),
db.ForeignKeyConstraint(["ciacodigo", "nivcodigo"], ["inbnivel.ciacodigo", "inbnivel.nivcodigo"]),
db.ForeignKeyConstraint(["ciacodigo", "pascodigo"], ["inbpasillo.ciacodigo", "inbpasillo.pascodigo"]),
db.ForeignKeyConstraint(["ciacodigo", "poscodigo"], ["inbposicion.ciacodigo", "inbposicion.poscodigo"]),
db.ForeignKeyConstraint(["ciacodigo", "toncodigo"], ["inbtono.ciacodigo", "inbtono.toncodigo"]),
db.ForeignKeyConstraint(["ciacodigo", "izoncodigo"], ["inbzona.ciacodigo", "inbzona.izoncodigo"]),
db.ForeignKeyConstraint(["ciacodigo", "invcodigo", "artcodigo"], ["inmart.ciacodigo", "inmart.invcodigo", "inmart.artcodigo"])


class InmStockDetAudSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InmStockDetAud
