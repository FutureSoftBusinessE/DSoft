from app.extensions import db
from app.extensions import ma


class InbTipoEmpaque(db.Model):
    __tablename__ = "inbtipoempaque"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    empaquetipo = db.Column(db.String(60), primary_key=True)
    empaquefecisys = db.Column(db.DateTime, nullable=False)
    empaquehorisys = db.Column(db.DateTime, nullable=False)
    empaqueusuisys = db.Column(db.String(10), nullable=False)
    empaqueestisys = db.Column(db.String(60), nullable=False)
    empaquefecmsys = db.Column(db.DateTime, nullable=False)
    empaquehormsys = db.Column(db.DateTime, nullable=False)
    empaqueusumsys = db.Column(db.String(10), nullable=False)
    empaqueestmsys = db.Column(db.String(60), nullable=False)


class InbTipoEmpaqueSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InbTipoEmpaque
