# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class Usuario(db.Model):
    prefijoDB = "SiacPracticasa"  # esto debe llenarse con la traida del 2do endpoint
    __tablename__ = "siaccusr"
    __table_args__ = {"schema": prefijoDB + ".dbo"}

    usrcodigo = db.Column(db.String)
    usrnombre = db.Column(db.String)
    usrclave = db.Column(db.String)
    usremail = db.column(db.String)
    usrpassword = db.column(db.String)
    usrstatus = db.column(db.String)

    __table_args__ = (PrimaryKeyConstraint("usrcodigo", "usrclave", name="pk_siaccusr"), {"schema": prefijoDB + ".dbo"})


class UsuarioSchema(ma.Schema):
    class Meta:
        fields = ("usrcodigo", "usrnombre", "usrclave", "usremail", "usrpassword", "usrstatus")


Usuario_schema = UsuarioSchema()
# siacPracticasaSiacusr_schema_varios = siacPracticasaSiacusrS
