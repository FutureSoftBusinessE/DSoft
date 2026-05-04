# flake8: noqa
from app.extensions import db
from app.extensions import ma


class inbinv(db.Model):
    __tablename__ = "inbinv"

    ciacodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    invcodigo = db.Column(db.String(2), primary_key=True, nullable=False)
    invdescri = db.Column(db.String(30), nullable=False)
    invstatus = db.Column(db.String(1), nullable=False)
    invfecisys = db.Column(db.DateTime, nullable=False)
    invhorisys = db.Column(db.DateTime, nullable=False)
    invusuisys = db.Column(db.String(10), nullable=False)
    invfecmsys = db.Column(db.DateTime, nullable=False)
    invhormsys = db.Column(db.DateTime, nullable=False)
    invusumsys = db.Column(db.String(10), nullable=False)


# Indice no agrupado
class ix_inbinv1(db.Index):
    __tablename__ = "inbinv"
    __table_args__ = {"extend_existing": True}

    ciacodigo = db.Column(db.String(2), nullable=False)
    invdescri = db.Column(db.String(30), nullable=False)

    __index_options__ = {
        "fillfactor": 90,
        "sort_in_tempdb": False,
        "ignore_dup_key": False,
        "statistics_norecompute": False,
        "online": False,
        "allow_row_locks": True,
        "allow_page_locks": True,
        "unique": False,
    }


class inbinvSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = inbinv
