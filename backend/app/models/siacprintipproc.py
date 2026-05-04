# flake8: noqa
from app.extensions import db
from app.extensions import ma


class siacprintipproc(db.Model):
    __tablename__ = "siacprintipproc"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    printproceso = db.Column(db.String(50), primary_key=True, nullable=False)


class siacprintipprocSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siacprintipproc
