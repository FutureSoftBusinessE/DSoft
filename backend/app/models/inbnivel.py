# flake8: noqa
from app.extensions import db, ma


class inbNivel(db.Model):
    __tablename__ = "inbnivel"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    nivcodigo = db.Column(db.String(10), primary_key=True)
    nivdescripcion = db.Column(db.String(60), nullable=False)
    nivfecisys = db.Column(db.DateTime, nullable=False)
    nivhorisys = db.Column(db.DateTime, nullable=False)
    nivusuisys = db.Column(db.String(10), nullable=False)
    nivestisys = db.Column(db.String(50), nullable=False)
    nivfecmsys = db.Column(db.DateTime, nullable=False)
    nivhormsys = db.Column(db.DateTime, nullable=False)
    nivusumsys = db.Column(db.String(10), nullable=False)
    nivestmsys = db.Column(db.String(50), nullable=False)
    nivstatus = db.Column(db.String(1), nullable=False, default="A")


class inbNivelSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbNivel
