# flake8: noqa
from app.extensions import db
from app.extensions import ma


class Siactusrweb(db.Model):
    __tablename__ = "siactusrweb"
    # __table_args__ = {'schema': 'SiacPracticasa.dbo'}

    ciacodigo = db.Column(db.String(2), primary_key=True)
    usrcodigo = db.Column(db.String(10), primary_key=True)
    modcodigo = db.Column(db.String(3), primary_key=True)
    opctag = db.Column(db.String(30), primary_key=True)
    usrfecisys = db.Column(db.DateTime)
    usrusuisys = db.Column(db.String(10))
    usrestisys = db.Column(db.String(40))
    usraccion = db.Column(db.String(6))
    id_item = db.Column(db.Integer)


class SiactusrwebSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Siactusrweb
