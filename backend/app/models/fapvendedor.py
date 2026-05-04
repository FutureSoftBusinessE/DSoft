# flake8: noqa
from app.extensions import db
from app.extensions import ma


class Fapvendedor(db.Model):
    __tablename__ = "fapvendedor"

    ciacodigo = db.Column(db.String, primary_key=True)
    vencodigo = db.Column(db.String, primary_key=True)
    vennombre = db.Column(db.String)
    vendireccion = db.Column(db.String)
    ventelefono = db.Column(db.String)
    vencomision = db.Column(db.Numeric)
    ventipcom = db.Column(db.String)
    venaplica = db.Column(db.String)
    vencontacto = db.Column(db.Numeric)
    venstatus = db.Column(db.String)
    venfecisys = db.Column(db.DateTime)
    venhorisys = db.Column(db.DateTime)
    venusuisys = db.Column(db.String)
    venestisys = db.Column(db.String)
    venfecmsys = db.Column(db.DateTime)
    venhormsys = db.Column(db.DateTime)
    venusumsys = db.Column(db.String)
    venestmsys = db.Column(db.String)
    usrcodigo = db.Column(db.String)
    vencomisiona = db.Column(db.Integer)
    emcodemp = db.Column(db.String)
    loccodigo = db.Column(db.String)
    pedidossiac = db.Column(db.Integer)
    pedidosweb = db.Column(db.Integer)


class FapvendedorSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Fapvendedor
