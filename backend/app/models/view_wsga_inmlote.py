# flake8: noqa
from app.extensions import db, ma


class view_wsga_inmlote(db.Model):
    __tablename__ = "view_wsga_inmlote"

    ciacodigo = db.Column(db.String)
    loccodigo = db.Column(db.String)
    usrcodigo = db.Column(db.String)
    invcodigo = db.Column(db.String)
    bodcodigo = db.Column(db.String)
    boddescri = db.Column(db.String)
    artcodigo = db.Column(db.String, primary_key=True)
    artdescri = db.Column(db.String)
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
    artlote = db.Column(db.String)
    artfecfab = db.Column(db.String)
    artfecven = db.Column(db.String)
    artcantlote = db.Column(db.String)
    lotecantconver = db.Column(db.String)
    artcantconfirmar = db.Column(db.String)
    artcantconvertconfirmar = db.Column(db.String)


class view_wsga_inmloteSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = view_wsga_inmlote
