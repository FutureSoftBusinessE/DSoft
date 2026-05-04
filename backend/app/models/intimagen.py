# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class intimagen(db.Model):
    __tablename__ = "intimagen"

    ciacodigo = db.Column(db.String, primary_key=True)
    invcodigo = db.Column(db.String, primary_key=True)
    artcodigo = db.Column(db.String, primary_key=True)
    artsecuen = db.Column(db.Integer, primary_key=True)
    artimagen = db.Column(db.LargeBinary)
    artfecmsys = db.Column(db.DateTime)
    arthormsys = db.Column(db.DateTime)
    artestmsys = db.Column(db.String)
    artusumsys = db.Column(db.String)

    # __table_args__ = (
    #     PrimaryKeyConstraint('ciacodigo', 'invcodigo', 'artcodigo', 'artsecuen'),
    # )


class intimagenSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = intimagen
