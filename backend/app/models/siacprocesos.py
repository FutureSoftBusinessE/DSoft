# flake8: noqa
from app.extensions import db
from app.extensions import ma


class siacprocesos(db.Model):
    __tablename__ = "siacprocesos"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    procesocod = db.Column(db.String(50), primary_key=True, nullable=False)
    espcodigo = db.Column(db.String(6), nullable=True)
    invcodigo = db.Column(db.String(2), nullable=True)
    artcodigo = db.Column(db.String(15), nullable=True)
    procesosta = db.Column(db.String(1), nullable=False)
    procesofisys = db.Column(db.DateTime, nullable=False)
    procesohisys = db.Column(db.DateTime, nullable=False)
    procesouisys = db.Column(db.String(50), nullable=False)
    procesoeisys = db.Column(db.String(50), nullable=False)
    procesofmsys = db.Column(db.DateTime, nullable=False)
    procesohmsys = db.Column(db.DateTime, nullable=False)
    procesoumsys = db.Column(db.String(50), nullable=False)
    procesoemsys = db.Column(db.String(50), nullable=False)


class siacprocesosSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siacprocesos
