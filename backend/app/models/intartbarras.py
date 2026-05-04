# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class intartbarras(db.Model):
    __tablename__ = "intartbarras"

    ciacodigo = db.Column(db.String(2), nullable=False)
    invcodigo = db.Column(db.String(2), nullable=False)
    artcodigo = db.Column(db.String(15), nullable=False)
    artcodbarra = db.Column(db.String(15), nullable=False, primary_key=True)
    artfecmsys = db.Column(db.DateTime, nullable=False)
    arthormsys = db.Column(db.DateTime, nullable=False)
    artestmsys = db.Column(db.String(40), nullable=False)
    artusumsys = db.Column(db.String(10), nullable=False)

    # # Definir la clave primaria compuesta usando PrimaryKeyConstraint
    # __table_args__ = (
    #     PrimaryKeyConstraint('ciacodigo', 'invcodigo', 'artcodbarra'),
    # )

    # # Definir la foreign key
    # __table_args__ += (
    #     db.ForeignKeyConstraint(['ciacodigo', 'invcodigo', 'artcodigo'],
    #                             ['inmart.ciacodigo', 'inmart.invcodigo', 'inmart.artcodigo'],
    #                             ondelete='CASCADE'),
    # )


class intartbarrasSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = intartbarras
