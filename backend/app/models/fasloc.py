# flake8: noqa
from app.extensions import db, ma


class fasloc(db.Model):
    __tablename__ = "fasloc"

    ciacodigo = db.Column(db.String(2), nullable=False, primary_key=True)
    loccodigo = db.Column(db.String(2), nullable=False, primary_key=True)
    factippag = db.Column(db.String(3), nullable=False, primary_key=True)
    venfecmsys = db.Column(db.DateTime, nullable=False)
    venhormsys = db.Column(db.DateTime, nullable=False)
    venusumsys = db.Column(db.String(10), nullable=False)
    venestmsys = db.Column(db.String(50), nullable=False, default=db.func.host_name())


### DefiniciÃ³n del Esquema `FaslocSchema`


class faslocSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = fasloc
