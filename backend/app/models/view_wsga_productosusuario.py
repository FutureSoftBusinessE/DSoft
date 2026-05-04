# flake8: noqa
from app.extensions import db, ma


class ViewWsgaProductosUsuario(db.Model):
    __tablename__ = "view_wsga_productosusuario"
    __table_args__ = {"schema": "dbo"}

    ciacodigo = db.Column(db.String)
    loccodigo = db.Column(db.String)
    usrcodigo = db.Column(db.String)
    artcodigo = db.Column(db.String, primary_key=True)
    invcodigo = db.Column(db.String)
    invdescri = db.Column(db.String)
    artdescri = db.Column(db.String)
    lincodigo = db.Column(db.String)
    lindescri = db.Column(db.String)
    marcodigo = db.Column(db.String)
    mardescri = db.Column(db.String)
    precodigo = db.Column(db.String)
    predescri = db.Column(db.String)
    medcodigo = db.Column(db.String)
    meddescri = db.Column(db.String)


class ViewWsgaProductosUsuarioSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ViewWsgaProductosUsuario
