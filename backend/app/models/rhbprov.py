# flake8: noqa
from app.extensions import db
from app.extensions import ma


class rhbprov(db.Model):
    __tablename__ = "rhbprov"

    procodigo = db.Column(db.String(3), primary_key=True, nullable=False)
    prodescri = db.Column(db.String(20), nullable=False)
    prostatus = db.Column(db.String(1), nullable=False)
    profecsys = db.Column(db.DateTime, nullable=False)
    prohorsys = db.Column(db.DateTime, nullable=False)
    proususys = db.Column(db.String(10), nullable=False)


class rhbprovSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = rhbprov
