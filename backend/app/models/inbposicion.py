# flake8: noqa
from app.extensions import db, ma


class inbPosicion(db.Model):
    __tablename__ = "inbposicion"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    poscodigo = db.Column(db.String(10), primary_key=True)
    posdescripcion = db.Column(db.String(60), nullable=False)
    posstatus = db.Column(db.String(1), nullable=False, default="A")
    posfecisys = db.Column(db.DateTime, nullable=False)
    poshorisys = db.Column(db.DateTime, nullable=False)
    posusuisys = db.Column(db.String(10), nullable=False)
    posestisys = db.Column(db.String(50), nullable=False)
    posfecmsys = db.Column(db.DateTime, nullable=False)
    poshormsys = db.Column(db.DateTime, nullable=False)
    posusumsys = db.Column(db.String(10), nullable=False)
    posestmsys = db.Column(db.String(50), nullable=False)


class inbPosicionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbPosicion
