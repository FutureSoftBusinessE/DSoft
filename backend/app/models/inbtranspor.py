# flake8: noqa
from app.extensions import db
from app.extensions import ma


class inbtranspor(db.Model):
    __tablename__ = "inbtranspor"

    ciacodigo = db.Column(db.String, primary_key=True)  # varchar
    transcodigo = db.Column(db.String, primary_key=True)  # varchar
    transdescri = db.Column(db.String)  # varchar
    transdirec = db.Column(db.String)  # varchar
    transruc = db.Column(db.String)  # varchar
    transtelef1 = db.Column(db.String)  # varchar
    transstatus = db.Column(db.String)  # varchar
    transfecisys = db.Column(db.DateTime)  # datetime
    transhorisys = db.Column(db.DateTime)  # datetime
    transusuisys = db.Column(db.String)  # varchar
    transusumsys = db.Column(db.String)  # varchar
    transfecmsys = db.Column(db.DateTime)  # datetime
    transhormsys = db.Column(db.DateTime)  # datetime
    transcontacto = db.Column(db.String)  # varchar
    transtipo = db.Column(db.String)  # varchar
    transcuenta = db.Column(db.String)  # varchar
    transcontactonombre = db.Column(db.String)  # varchar
    transcontactodirec = db.Column(db.String)  # varchar
    transcontactoemail = db.Column(db.String)  # varchar
    transcontactotelef = db.Column(db.String)  # varchar
    transplaca = db.Column(db.String)  # varchar


class inbtonoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbtranspor
