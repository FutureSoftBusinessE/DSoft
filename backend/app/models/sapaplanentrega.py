# flake8: noqa
from app.extensions import db
from app.extensions import ma


class sapaplanentrega(db.Model):
    __tablename__ = "sapaplanentrega"
    __table_args__ = {"schema": "SIACSAP.dbo"}

    idwmsInp = db.Column(db.String(36), primary_key=True, nullable=False)
    fecharegistro = db.Column(db.DateTime, primary_key=True, nullable=False)
    usuarioregistro = db.Column(db.String(50), primary_key=True, nullable=False)
    mensaje = db.Column("Mensaje", db.String(255), nullable=True)


class sapaplanentregaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = sapaplanentrega
