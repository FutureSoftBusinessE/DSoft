# flake8: noqa
from app.extensions import db
from app.extensions import ma


class inbsgaclibod(db.Model):
    __tablename__ = "inbsgaclibod"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    clicodigo = db.Column(db.String(6), primary_key=True)
    invcodigo = db.Column(db.String(2), primary_key=True)
    bodcodigo = db.Column(db.String(3), primary_key=True)
    clibodfecisys = db.Column(db.DateTime, nullable=False)
    clibodhorisys = db.Column(db.DateTime, nullable=False)
    clibodusuisys = db.Column(db.String(10), nullable=False)
    clibodestisys = db.Column(db.String(50), nullable=False)


class inbsgaclibodSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbsgaclibod
