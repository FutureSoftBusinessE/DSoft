from app.extensions import db
from app.extensions import ma


class inbsgamotivos(db.Model):
    __tablename__ = "inbsgamotivos"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    motcodigo = db.Column(db.String(3), primary_key=True)
    motdescripcion = db.Column(db.String(60), nullable=False)
    mottipo = db.Column(db.String(6), nullable=False)
    motstatus = db.Column(db.String(1), nullable=False)
    motfecisys = db.Column(db.DateTime, nullable=False)
    mothorisys = db.Column(db.DateTime, nullable=False)
    motusuisys = db.Column(db.String(10), nullable=False)
    motestisys = db.Column(db.String(50), nullable=False)
    motfecmsys = db.Column(db.DateTime, nullable=False)
    mothormsys = db.Column(db.DateTime, nullable=False)
    motusumsys = db.Column(db.String(10), nullable=False)
    motestmsys = db.Column(db.String(50), nullable=False)


class inbsgamotivosSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbsgamotivos
