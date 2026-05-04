# flake8: noqa
from app.extensions import db, ma


class siaccformulariosrespondidos(db.Model):
    __tablename__ = "siaccformulariosrespondidos"

    ciacodigo = db.Column(db.String(2), nullable=False)
    sgasoling = db.Column(db.String(18), nullable=False)
    formrespondidocodigo = db.Column(db.String(13), nullable=False)
    formcodigo = db.Column(db.String(13), nullable=False)
    procesocod = db.Column(db.String(50), nullable=False)
    formdescri = db.Column(db.String(100), nullable=False)
    formstatus = db.Column(db.String(1), nullable=False)
    formrespondidofecisys = db.Column(db.DateTime, nullable=False)
    formrespondidohorisys = db.Column(db.DateTime, nullable=False)
    formrespondidousuisys = db.Column(db.String(50), nullable=False)
    formrespondidoestisys = db.Column(db.String(50), nullable=False)
    formrespondidofecmsys = db.Column(db.DateTime, nullable=False)
    formrespondidohormsys = db.Column(db.DateTime, nullable=False)
    formrespondidousumsys = db.Column(db.String(50), nullable=False)
    formrespondidoestmsys = db.Column(db.String(50), nullable=False)

    __table_args__ = (db.PrimaryKeyConstraint("ciacodigo", "formrespondidocodigo", "formcodigo", name="PK_siaccformulariosrespondidos"),)


class siaccformulariosrespondidosSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = siaccformulariosrespondidos
