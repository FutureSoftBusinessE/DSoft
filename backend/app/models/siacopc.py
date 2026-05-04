# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class Siacopc(db.Model):
    __tablename__ = "siacopc"
    # __table_args__ = {'schema': 'SiacPracticasa.dbo'}
    modcodigo = db.Column(db.String(3))
    opccaption = db.Column(db.String(255), primary_key=True)
    opcname = db.Column(db.String(255))
    opctag = db.Column(db.String(30))
    opcparent = db.Column(db.String(30))
    opchijo = db.Column(db.Integer)
    opcmenu = db.Column(db.String(100))
    opcmenujquery = db.Column(db.String(100))
    opcicono = db.Column(db.String(20))
    opcicon = db.Column(db.String(20))
    opcimagen = db.Column(db.LargeBinary)
    opcimagentype = db.Column(db.String(50))
    opccontroller = db.Column(db.String(50))
    opcaction = db.Column(db.String(50))
    nivel = db.Column(db.Integer)
    item_number = db.Column(db.String)
    padre_id = db.Column(db.String)
    opcstatus = db.Column(db.String)


class SiacopcSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Siacopc
