# flake8: noqa
from app.extensions import db
from app.extensions import ma


class siacsritarifaiva(db.Model):
    __tablename__ = "siacsritarifaiva"

    codigo = db.Column(db.String(2), primary_key=True, nullable=False)
    descripcion = db.Column(db.String(120), nullable=False)
    porcentaje = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    disponible = db.Column(db.Integer, default=0, nullable=False)


class SiacSriTarifaIvaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siacsritarifaiva
