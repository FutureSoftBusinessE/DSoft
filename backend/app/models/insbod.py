# flake8: noqa
from app.extensions import db
from app.extensions import ma


class insbod(db.Model):
    __tablename__ = "insbod"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    bodcodigo = db.Column(db.String(3), primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    bodfecmsys = db.Column(db.DateTime, nullable=False)
    bodhormsys = db.Column(db.DateTime, nullable=False)
    bodusumsys = db.Column(db.String(10), nullable=False)
    usrcodigo = db.Column(db.String(10), primary_key=True)
    bodestmsys = db.Column(db.String(50), nullable=False, default="host_name()")


class insbodSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = insbod
