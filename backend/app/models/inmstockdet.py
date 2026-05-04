# flake8: noqa
from app.extensions import db
from app.extensions import ma


class InmStockDet(db.Model):
    __tablename__ = "inmstockdet"

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
    stokdetcantidad = db.Column(db.Numeric(18, 6), nullable=False)
    stokdetcantconver = db.Column(db.Numeric(18, 6), nullable=False)
    stokdetstatus = db.Column(db.String(1), nullable=False)
    stokdetfecmsys = db.Column(db.DateTime, nullable=False, server_default=db.func.current_date())
    stokdethormsys = db.Column(db.DateTime, nullable=False, server_default=db.func.current_time())
    stokdetusumsys = db.Column(db.String(10), nullable=False)
    stokdetestmsys = db.Column(db.String(50), nullable=False)
    palletid = db.Column(db.String(18), default="", nullable=True)

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
        ),
    )


class InmStockDetSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InmStockDet
