# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class Marca(db.Model):
    __tablename__ = "inbmar"

    ciacodigo = db.Column(db.String)
    marcodigo = db.Column(db.String)
    mardescri = db.Column(db.String)
    marstatus = db.Column(db.String)
    marfecisys = db.Column(db.DateTime)
    marhorisys = db.Column(db.DateTime)
    marusuisys = db.Column(db.String)
    marfecmsys = db.Column(db.DateTime)
    marhormsys = db.Column(db.DateTime)
    marusumsys = db.Column(db.String)

    __table_args__ = (PrimaryKeyConstraint("ciacodigo", "marcodigo", name="pk_inbmar"),)


class MarcaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model: Marca
