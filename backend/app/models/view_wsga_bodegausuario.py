# flake8: noqa
from app.extensions import db, ma


class ViewWsgaBodegaUsuario(db.Model):
    __tablename__ = "view_wsga_bodegausuario"

    ciacodigo = db.Column(db.String, primary_key=True)
    loccodigo = db.Column(db.String, primary_key=True)
    invcodigo = db.Column(db.String, primary_key=True)
    usrcodigo = db.Column(db.String)
    bodcodigo = db.Column(db.String, primary_key=True)
    boddescri = db.Column(db.String)


class ViewWsgaBodegaUsuarioSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ViewWsgaBodegaUsuario
