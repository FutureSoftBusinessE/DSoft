# flake8: noqa
from app.extensions import db
from app.extensions import ma


class inbembalaje(db.Model):
    __tablename__ = "inbembalaje"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    embcodigo = db.Column(db.String(10), primary_key=True)
    embdescripcion = db.Column(db.String(60), nullable=False)
    embmetros3 = db.Column(db.Numeric(18, 2), nullable=False)
    embpieza = db.Column(db.Integer, nullable=False, default=0)
    embmetros2 = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    emblastra = db.Column(db.Boolean, nullable=False, default=False)
    embfecisys = db.Column(db.DateTime, nullable=False)
    embhorisys = db.Column(db.DateTime, nullable=False)
    embusuisys = db.Column(db.String(10), nullable=False)
    embestisys = db.Column(db.String(50), nullable=False)
    embfecmsys = db.Column(db.DateTime, nullable=False)
    embhormsys = db.Column(db.DateTime, nullable=False)
    embusumsys = db.Column(db.String(10), nullable=False)
    embestmsys = db.Column(db.String(50), nullable=False)
    embstatus = db.Column(db.String(1), nullable=False, default="A")


class inbembalajeSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbembalaje
