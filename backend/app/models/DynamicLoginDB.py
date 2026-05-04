# flake8: noqa
from app.extensions import db
from app.extensions import ma


class DynamicLoginDB(db.Model):
    __tablename__ = "siaccusr"
    # __table_args__ = {'schema': 'SiacPracticasa.dbo'}
    # __table_args__ = {'schema': None}
    id = db.Column(db.Integer)  # , primary_key=True)
    usrclave = db.Column(db.String(10), primary_key=True)
    usrcodigo = db.Column(db.String(100), primary_key=True)
    usrcodper = db.Column(db.String(10))
    usrcorreo = db.Column(db.String(60))
    usrdiascaduclave = db.Column(db.Integer)
    usremail = db.Column(db.String(60))
    usrestisys = db.Column(db.String(40))
    usrestmsys = db.Column(db.String(40))
    usrfecactuclave = db.Column(db.DateTime)
    usrfeccad = db.Column(db.DateTime)
    usrfecisys = db.Column(db.DateTime)
    usrfecmsys = db.Column(db.DateTime)
    usrflagnuevmodi = db.Column(db.Integer)
    usrflagoficre = db.Column(db.Integer)
    usrflagperfil = db.Column(db.Integer)
    usrflagupdateperfilacces = db.Column(db.Boolean)
    usrhelpart = db.Column(db.String(1))
    usrhelpcli = db.Column(db.String(1))
    usrhelppro = db.Column(db.String(1))
    usrhorisys = db.Column(db.DateTime)
    usrhormsys = db.Column(db.DateTime)
    usrimagen = db.Column(db.LargeBinary)
    usrimagentype = db.Column(db.String(50))
    usrnombre = db.Column(db.String(60))
    usrpassword = db.Column(db.String(50))
    usrstatus = db.Column(db.String(1))
    usrusuisys = db.Column(db.String(10))
    usrusumsys = db.Column(db.String(10))

    # def __init__(self, id, usrclave, usrcodigo, usrcodper, usrcorreo, usrdiascaduclave, usremail, usrestisys, usrestmsys, usrfecactuclave, usrfeccad, usrfecisys, usrfecmsys, usrflagnuevmodi, usrflagoficre, usrflagperfil, usrflagupdateperfilacces, usrhelpart, usrhelpcli, usrhelppro, usrhorisys, usrhormsys, usrimagen, usrimagentype, usrnombre, usrpassword, usrstatus, usrusuisys, usrusumsys):
    #     self.id = id
    #     self.usrclave = usrclave
    #     self.usrcodigo = usrcodigo
    #     self.usrcodper = usrcodper
    #     self.usrcorreo = usrcorreo
    #     self.usrdiascaduclave = usrdiascaduclave
    #     self.usremail = usremail
    #     self.usrestisys = usrestisys
    #     self.usrestmsys = usrestmsys
    #     self.usrfecactuclave = usrfecactuclave
    #     self.usrfeccad = usrfeccad
    #     self.usrfecisys = usrfecisys
    #     self.usrfecmsys = usrfecmsys
    #     self.usrflagnuevmodi = usrflagnuevmodi
    #     self.usrflagoficre = usrflagoficre
    #     self.usrflagperfil = usrflagperfil
    #     self.usrflagupdateperfilacces = usrflagupdateperfilacces
    #     self.usrhelpart = usrhelpart
    #     self.usrhelpcli = usrhelpcli
    #     self.usrhelppro = usrhelppro
    #     self.usrhorisys = usrhorisys
    #     self.usrhormsys = usrhormsys
    #     self.usrimagen = usrimagen
    #     self.usrimagentype = usrimagentype
    #     self.usrnombre = usrnombre
    #     self.usrpassword = usrpassword
    #     self.usrstatus = usrstatus
    #     self.usrusuisys = usrusuisys
    #     self.usrusumsys = usrusumsys


class DynamicLoginDBSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = DynamicLoginDB


# DynamicLoginDBSchema = DynamicLoginDBSchema()
# DynamicLoginDBSchemas = DynamicLoginDBSchema(many=True)
