# flake8: noqa
from app.extensions import db
from app.extensions import ma


class fatpedobs(db.Model):
    __tablename__ = "fatpedobs"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    pednumped = db.Column(db.String(18), primary_key=True, nullable=False)
    loccodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    obssecuen = db.Column(db.Integer, primary_key=True, nullable=False)
    obsaccion = db.Column(db.String(3), nullable=False)
    obsstatus = db.Column(db.String(1), nullable=False)
    obsobserva = db.Column(db.String(255), nullable=True)
    obsestisys = db.Column(db.String(30), nullable=False)
    obsfecisys = db.Column(db.DateTime, nullable=False)
    obshorisys = db.Column(db.DateTime, nullable=False)
    obsusuisys = db.Column(db.String(10), nullable=False)
    audnumxml = db.Column(db.String(18), nullable=True)
    obstipo = db.Column(db.String(1), default="S", nullable=False)
    estadodescri = db.Column(db.String(60), nullable=True)
    obsemail = db.Column(db.String(60), nullable=True)
    obscontroltarea = db.Column(db.Integer, default=0, nullable=False)


class fatpedobsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = fatpedobs
