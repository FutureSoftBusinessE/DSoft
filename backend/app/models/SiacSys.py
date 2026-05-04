# flake8: noqa
from app.extensions import db
from app.extensions import ma


class SiacSys(db.Model):
    __tablename__ = "SiacSys"

    carconca = db.Column(db.String, primary_key=True)
    maskfecha = db.Column(db.String)
    maskhora = db.Column(db.String)
    maskfechap = db.Column(db.String)
    maskhorap = db.Column(db.String)
    masknumero = db.Column(db.String)
    masknumerop = db.Column(db.String)
    codmonlocal = db.Column(db.String)
    monlocal = db.Column(db.String)
    codmonextra = db.Column(db.String)
    monextra = db.Column(db.String)
    uidcr = db.Column(db.String)
    pwdcr = db.Column(db.String)
    apliret = db.Column(db.Integer)
    sysiva = db.Column(db.Numeric)
    maskfono = db.Column(db.String)
    sysidioma = db.Column(db.String)
    gruiniing = db.Column(db.String)
    gruinigas = db.Column(db.String)
    ciacodtar = db.Column(db.String)
    ciafactormin = db.Column(db.Numeric)
    formatocta = db.Column(db.String)
    nivelescta = db.Column(db.Integer)
    ctaperigan = db.Column(db.String)
    validanull = db.Column(db.String)
    ciamatriz = db.Column(db.String)
    ctaganancia = db.Column(db.String)
    valorconsumidorfinal = db.Column(db.Numeric)


class SiacSysSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SiacSys
