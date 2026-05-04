# flake8: noqa
from app.extensions import db, ma


class OraSiacTipTraApi(db.Model):
    __tablename__ = "OraSiacTipTraApi"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    codtra = db.Column(db.String(50), primary_key=True)
    destra = db.Column(db.String(50))
    estatustra = db.Column(db.String(50))

    def __init__(self, codtra, destra, estatustra):
        self.codtra = codtra
        self.destra = destra
        self.estatustra = estatustra


class OraSiacTipTraApiSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = OraSiacTipTraApi
        load_instance = True


# Esquemas para serializaciÃ³n/deserializaciÃ³n
orasiactiptraapi_schema = OraSiacTipTraApiSchema()
orasiactiptraapi_schema_varios = OraSiacTipTraApiSchema(many=True)
