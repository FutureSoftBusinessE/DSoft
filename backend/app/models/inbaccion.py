# flake8: noqa
from app.extensions import db, ma


class inbaccion(db.Model):
    __tablename__ = "inbaccion"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    acccodigo = db.Column(db.String(15), primary_key=True)
    accion = db.Column(db.String(15), nullable=False)
    accfecisys = db.Column(db.DateTime, nullable=False)
    acchorisys = db.Column(db.DateTime, nullable=False)
    accusuisys = db.Column(db.String(10), nullable=False)
    accfecmsys = db.Column(db.DateTime, nullable=False)
    acchormsys = db.Column(db.DateTime, nullable=False)
    accusumsys = db.Column(db.String(10), nullable=False)


class inbaccionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbaccion
