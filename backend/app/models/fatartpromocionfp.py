# flake8: noqa
from app.extensions import db
from app.extensions import ma


class fatartpromocionfp(db.Model):
    __tablename__ = "fatartpromocionfp"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    invcodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    artcodigo = db.Column(db.String(15), primary_key=True, nullable=False)
    loccodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    factippag = db.Column(db.String(3), primary_key=True, nullable=False)
    forpordes1 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    forpordes2 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    forpordes3 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    forpordes4 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    forpordes5 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    forpordes6 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    forfecinipro = db.Column(db.DateTime, nullable=False)
    forhorinipro = db.Column(db.DateTime, nullable=False)
    forfecfinpro = db.Column(db.DateTime, nullable=False)
    forhorfinpro = db.Column(db.DateTime, nullable=False)
    forfecsys = db.Column(db.DateTime, nullable=False)
    forhorsprinter2 = db.Column(db.DateTime, nullable=False)
    forususys = db.Column(db.String(10), nullable=False)
    forestsys = db.Column(db.String(30), nullable=False)


class fatartpromocionfpSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = fatartpromocionfp
