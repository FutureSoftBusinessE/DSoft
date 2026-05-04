# flake8: noqa
from app.extensions import db
from app.extensions import ma


class view_inv_bahias(db.Model):
    __tablename__ = "view_inv_bahias"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    invcodigo = db.Column(db.String(10), primary_key=True)
    bodcodigo = db.Column(db.String(10), primary_key=True)
    bahcodigo = db.Column(db.String(10), primary_key=True)
    bahdescripcion = db.Column(db.String(60), nullable=False)
    bahmetros3 = db.Column(db.Numeric(18, 2), nullable=False)
    bahfecisys = db.Column(db.DateTime, nullable=False)
    bahhorisys = db.Column(db.DateTime, nullable=False)
    bahusuisys = db.Column(db.String(10), nullable=False)
    bahestisys = db.Column(db.String(50), nullable=False)
    bahfecmsys = db.Column(db.DateTime, nullable=False)
    bahhormsys = db.Column(db.DateTime, nullable=False)
    bahusumsys = db.Column(db.String(10), nullable=False)
    bahestmsys = db.Column(db.String(50), nullable=False)
    bahstatus = db.Column(db.String(1), nullable=False)
    izoncodigo = db.Column(db.String(10), nullable=False)
    pascodigo = db.Column(db.String(10), nullable=False)
    pasdescripcion = db.Column(db.String(60), nullable=False)
    passtatus = db.Column(db.String(1), nullable=False)
    izondescripcion = db.Column(db.String(60), nullable=False)
    izonstatus = db.Column(db.String(1), nullable=False)
    izontipo = db.Column(db.String(1), nullable=False)
    boddescri = db.Column(db.String(60), nullable=False)
    loccodigo = db.Column(db.String(10), nullable=False)


class view_inv_bahias_schema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = view_inv_bahias
