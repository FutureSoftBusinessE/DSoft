from app.extensions import db
from app.extensions import ma


class inpSgaBahClasi(db.Model):
    __tablename__ = "inpSgaBahClasi"

    ciacodigo = db.Column(db.String(2), primary_key=True)
    bahclasi = db.Column(db.String(50), primary_key=True)


class inpSgaBahClasiSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inpSgaBahClasi
