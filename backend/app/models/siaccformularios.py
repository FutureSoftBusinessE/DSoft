# flake8: noqa
from app.extensions import db
from app.extensions import ma


class siaccformularios(db.Model):
    __tablename__ = "siaccformularios"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    formcodigo = db.Column(db.String(13), primary_key=True, nullable=False)
    procesocod = db.Column(db.String(50), primary_key=True, nullable=False)
    formdescri = db.Column(db.String(100), nullable=False)
    formstatus = db.Column(db.String(1), nullable=False)
    formfecisys = db.Column(db.DateTime, nullable=False)
    formhorisys = db.Column(db.DateTime, nullable=False)
    formusuisys = db.Column(db.String(50), nullable=False)
    formestisys = db.Column(db.String(50), nullable=False)
    formfecmsys = db.Column(db.DateTime, nullable=False)
    formhormsys = db.Column(db.DateTime, nullable=False)
    formusumsys = db.Column(db.String(50), nullable=False)
    formestmsys = db.Column(db.String(50), nullable=False)

    # Defining the primary key constraint
    __table_args__ = (db.PrimaryKeyConstraint("ciacodigo", "formcodigo", "procesocod"),)


class siaccformulariosSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siaccformularios
