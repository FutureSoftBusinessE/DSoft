# flake8: noqa
from app.extensions import db
from app.extensions import ma


class medauditoria(db.Model):
    __tablename__ = "medauditoria"

    usrcodigo = db.Column(db.String(10), primary_key=True, nullable=False)
    usrnombre = db.Column(db.String(100), nullable=False)
    hostname = db.Column(db.String(100), nullable=False)
    hostip = db.Column(db.String(100), nullable=False)
    fecisys = db.Column(db.DateTime, primary_key=True, nullable=False)
    modcodigo = db.Column(db.String(3), primary_key=True, nullable=False)


class medauditoriaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = medauditoria
