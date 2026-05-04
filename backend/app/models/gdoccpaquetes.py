# flake8: noqa
from app.extensions import db, ma


class gdoccpaquetes(db.Model):
    __tablename__ = "gdoccpaquetes"

    ciacodigo = db.Column(db.String(2), nullable=False)
    formcodigo = db.Column(db.String(13), nullable=False)
    procesocod = db.Column(db.String(50), nullable=False)
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

    __table_args__ = (db.PrimaryKeyConstraint("ciacodigo", "formcodigo", "procesocod", name="PK_gdoccpaquetes"),)


class gdoccpaquetesSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = gdoccpaquetes
