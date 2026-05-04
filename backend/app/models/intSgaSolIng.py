# flake8: noqa
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    DefaultClause,
)
from app.extensions import db
from app.extensions import ma


class intSgaSolIng(db.Model):
    __tablename__ = "intSgaSolIng"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    loccodigo = db.Column(db.String(2), primary_key=True)
    sgasoling = db.Column(db.String(18), primary_key=True)
    sgaorigen = db.Column(db.String(10), nullable=False)
    sgagenepor = db.Column(db.String(10), nullable=False)
    invcodigo = db.Column(db.String(2), nullable=False)
    artcodigo = db.Column(db.String(15), nullable=False)
    sgasecuen = db.Column(db.Integer, nullable=False, default=0)
    sgacansol = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    sgacanrec = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    sgastatus = db.Column(db.String(20))
    sgaulttranumrecep = db.Column(db.String(18))
    sgaultfecrecep = db.Column(db.DateTime)
    sgaulthorrecep = db.Column(db.DateTime)
    sgaultusurecep = db.Column(db.String(10))
    sgaultestrecep = db.Column(db.String(50))
    sgafecsol = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    sgahorsol = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    sgaususol = db.Column(db.String(10), nullable=False)
    sgaestsol = db.Column(db.String(50), nullable=False)
    sgafecmsys = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    sgahormsys = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    sgausumsys = db.Column(db.String(10), nullable=False)
    sgaestmsys = db.Column(db.String(50), nullable=False)
    EBELP = db.Column(db.Numeric(18, 0))
    MATNR = db.Column(db.String(18))
    DETAIL_TAKE = db.Column(db.String(1))
    ERFMG = db.Column(db.Numeric(13, 3))
    WERKS = db.Column(db.String(4))
    LGORT = db.Column(db.String(4))
    CHARG = db.Column(db.String(10))
    BWTAR = db.Column(db.String(10))
    UMVFDAT = db.Column(db.DateTime)
    MENGE = db.Column(db.Numeric(18, 3))
    __table_args__ = (
        db.ForeignKeyConstraint(
            ["ciacodigo", "sgasoling", "loccodigo"],
            [
                "incSgaSolIng.ciacodigo",
                "incSgaSolIng.sgasoling",
                "incSgaSolIng.loccodigo",
            ],
        ),
        db.ForeignKeyConstraint(
            ["ciacodigo", "invcodigo", "artcodigo"],
            ["inmart.ciacodigo", "inmart.invcodigo", "inmart.artcodigo"],
        ),
        db.PrimaryKeyConstraint("ciacodigo", "sgasoling", "loccodigo", "sgasecuen", "invcodigo", "artcodigo"),
    )


class intSgaSolIngSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: intSgaSolIng
