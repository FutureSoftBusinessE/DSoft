# flake8: noqa
from app.extensions import db
from app.extensions import ma


class InbPasillo(db.Model):
    __tablename__ = "inbpasillo"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    pascodigo = db.Column(db.String(10), primary_key=True)
    pasdescripcion = db.Column(db.String(60), nullable=False)
    passtatus = db.Column(db.String(1), nullable=False, default="A")
    pasfecisys = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    pashorisys = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    pasusuisys = db.Column(db.String(10), nullable=False)
    pasestisys = db.Column(db.String(50), nullable=False)
    pasfecmsys = db.Column(db.DateTime, nullable=False, default=db.func.current_date())
    pashormsys = db.Column(db.DateTime, nullable=False, default=db.func.current_time())
    pasusumsys = db.Column(db.String(10), nullable=False)
    pasestmsys = db.Column(db.String(50), nullable=False)


class InbPasilloSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InbPasillo
