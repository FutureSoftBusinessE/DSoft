# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class Medida(db.Model):
    __tablename__ = "inbmed"

    ciacodigo = db.Column(db.String)
    medcodigo = db.Column(db.String)
    meddescri = db.Column(db.String)
    medstatus = db.Column(db.String)
    medfecisys = db.Column(db.DateTime)
    medhorisys = db.Column(db.DateTime)
    medusuisys = db.Column(db.String)
    medfecmsys = db.Column(db.DateTime)
    medhormsys = db.Column(db.DateTime)
    medusumsys = db.Column(db.String)

    __table_args__ = (PrimaryKeyConstraint("ciacodigo", "medcodigo", name="pk_inbmed"),)


class MedidaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: Medida
