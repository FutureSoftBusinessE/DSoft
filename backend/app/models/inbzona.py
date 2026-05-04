# flake8: noqa
from app.extensions import db
from app.extensions import ma


class inbzona(db.Model):
    __tablename__ = "inbzona"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    izoncodigo = db.Column(db.String(10), primary_key=True)
    izondescripcion = db.Column(db.String(60), nullable=False)
    izonstatus = db.Column(db.String(1), nullable=False, default="A")
    izonfecisys = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    izonhorisys = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    izonusuisys = db.Column(db.String(10), nullable=False)
    izonestisys = db.Column(db.String(50), nullable=False)
    izonfecmsys = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    izonhormsys = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    izonusumsys = db.Column(db.String(10), nullable=False)
    izonestmsys = db.Column(db.String(50), nullable=False)
    izontipo = db.Column(db.String(20), nullable=False, default="ALMACENAMIENTO")


class inbzonaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbzona
