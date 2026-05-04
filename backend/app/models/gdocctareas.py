# flake8: noqa
from app.extensions import db, ma


class gdocctareas(db.Model):
    __tablename__ = "gdocctareas"

    ciacodigo = db.Column(db.String(2), nullable=False)
    pregcodigo = db.Column(db.String(13), nullable=False)
    pregdescri = db.Column(db.String(100), nullable=False)
    pregtipo = db.Column(db.String(1), nullable=False)
    pregobligatoria = db.Column(db.Integer, nullable=False, default=0)
    pregdurmin = db.Column(db.Integer, nullable=False, default=0)
    pregrecuren = db.Column(db.String(20), nullable=False)
    pregstatus = db.Column(db.String(1), nullable=False)
    pregfecisys = db.Column(db.DateTime, nullable=False)
    pregorisys = db.Column(db.DateTime, nullable=False)
    pregusuisys = db.Column(db.String(50), nullable=False)
    pregestisys = db.Column(db.String(50), nullable=False)
    pregfecmsys = db.Column(db.DateTime, nullable=False)
    preghormsys = db.Column(db.DateTime, nullable=False)
    pregusumsys = db.Column(db.String(10), nullable=False)
    pregestmsys = db.Column(db.String(50), nullable=False)
    insticodigo = db.Column(db.String(3), nullable=True)
    pregespresencial = db.Column(db.Integer, nullable=False, default=0)

    __table_args__ = (db.PrimaryKeyConstraint("ciacodigo", "pregcodigo", name="PK_gdocctareas"),)


class gdocctareasSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = gdocctareas
