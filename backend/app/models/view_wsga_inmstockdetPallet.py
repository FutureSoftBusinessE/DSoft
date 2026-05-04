# flake8: noqa
from app.extensions import db
from app.extensions import ma


class view_wsga_inmstockdetPallet(db.Model):
    __tablename__ = "view_wsga_inmstockdetPallet"

    ciacodigo = db.Column(db.String, primary_key=True)
    loccodigo = db.Column(db.String)
    usrcodigo = db.Column(db.String)
    invcodigo = db.Column(db.String)
    bodcodigo = db.Column(db.String)
    boddescri = db.Column(db.String)
    palletid = db.Column(db.String)
    artcodigo = db.Column(db.String)
    artdescri = db.Column(db.String)
    artlote = db.Column(db.String)
    artserie = db.Column(db.String)
    artservicio = db.Column(db.String)
    artdecimal = db.Column(db.String)
    artregissani = db.Column(db.String)
    artobserva = db.Column(db.String)
    arttemperatura = db.Column(db.String)
    artconcentra = db.Column(db.String)
    lincodigo = db.Column(db.String)
    lindescri = db.Column(db.String)
    precodigo = db.Column(db.String)
    predescri = db.Column(db.String)
    marcodigo = db.Column(db.String)
    mardescri = db.Column(db.String)
    medcodigo = db.Column(db.String)
    meddescri = db.Column(db.String)
    pascodigo = db.Column(db.String)
    pasdescripcion = db.Column(db.String)
    bahcodigo = db.Column(db.String)
    bahdescripcion = db.Column(db.String)
    poscodigo = db.Column(db.String)
    posdescripcion = db.Column(db.String)
    nivcodigo = db.Column(db.String)
    nivdescripcion = db.Column(db.String)
    embcodigo = db.Column(db.String)
    embdescripcion = db.Column(db.String)
    toncodigo = db.Column(db.String)
    tondescripcion = db.Column(db.String)
    izoncodigo = db.Column(db.String)
    izondescripcion = db.Column(db.String)
    stokdetcantidad = db.Column(db.Numeric)
    stokdetcantconver = db.Column(db.Numeric)


class view_wsga_inmstockdetPalletSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = view_wsga_inmstockdetPallet
