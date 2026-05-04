# flake8: noqa
# Siacser

from app.extensions import db
from app.extensions import ma


class Siacser(db.Model):
    __tablename__ = "Siacser"

    locservidor = db.Column(db.String, primary_key=True)
    serdescri = db.Column(db.String)
    serstatus = db.Column(db.String)


class SiacserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Siacser
