# flake8: noqa
from app.extensions import db
from app.extensions import ma


class fatartpromocion(db.Model):
    __tablename__ = "fatartpromocion"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    invcodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    artcodigo = db.Column(db.String(15), primary_key=True, nullable=False)
    loccodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    factippag = db.Column(db.String(3), nullable=True)
    artpordes1 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    artpordes2 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    artpordes3 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    artpordes4 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    artpordes5 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    artpordes6 = db.Column(db.Numeric(7, 2), default=0, nullable=False)
    artfecinipro = db.Column(db.DateTime, nullable=False)
    arthorinipro = db.Column(db.DateTime, nullable=False)
    artfecfinpro = db.Column(db.DateTime, nullable=False)
    arthorfinpro = db.Column(db.DateTime, nullable=False)
    artfecsys = db.Column(db.DateTime, nullable=False)
    arthorsys = db.Column(db.DateTime, nullable=False)
    artususys = db.Column(db.String(10), nullable=False)
    artestsys = db.Column(db.String(30), nullable=False)
    artflagpromocion = db.Column(db.Integer, default=0, nullable=False)


class fatartpromocionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = fatartpromocion
