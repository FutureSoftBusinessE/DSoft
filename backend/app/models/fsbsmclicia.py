# flake8: noqa
from app.extensions import db
from app.extensions import ma


class fsbsmclicia(db.Model):
    __tablename__ = "fsbsmclicia"
    __table_args__ = {"schema": "siacfsbs.dbo"}
    cliciaidenti = db.Column(db.Numeric, primary_key=True)
    cliciagrupo = db.Column(db.String(50))
    cliciarutaBD = db.Column(db.String(100))
    clicianonBD = db.Column(db.String(100))
    cliciausuBD = db.Column(db.String(100))
    cliciaclaveBD = db.Column(db.String(100))
    cliciaciacodigo = db.Column(db.String(2))
    cliciacianombre = db.Column(db.String(100))
    cliciafecisys = db.Column(db.DateTime)
    cliciausuisys = db.Column(db.String(60))
    cliciaestisys = db.Column(db.String(60))

    def __init__(
        self,
        cliciaidenti,
        cliciagrupo,
        cliciarutaBD,
        clicianonBD,
        cliciausuBD,
        cliciaclaveBD,
        cliciaciacodigo,
        cliciacianombre,
        cliciafecisys,
        cliciausuisys,
        cliciaestisys,
    ):
        self.cliciaidenti = cliciaidenti
        self.cliciagrupo = cliciagrupo
        self.cliciarutaBD = cliciarutaBD
        self.clicianonBD = clicianonBD
        self.cliciausuBD = cliciausuBD
        self.cliciaclaveBD = cliciaclaveBD
        self.cliciaciacodigo = cliciaciacodigo
        self.cliciacianombre = cliciacianombre
        self.cliciafecisys = cliciafecisys
        self.cliciausuisys = cliciausuisys
        self.cliciaestisys = cliciaestisys


class fsbsmcliciaSchema(ma.Schema):
    class Meta:
        fields = (
            "cliciaidenti",
            "cliciagrupo",
            "cliciarutaBD",
            "clicianonBD",
            "cliciausuBD",
            "cliciaclaveBD",
            "cliciaciacodigo",
            "cliciacianombre",
            "cliciafecisys",
            "cliciausuisys",
            "cliciaestisys",
        )


fsbsmclicia_schema = fsbsmcliciaSchema()
fsbsmclicia_schema_varios = fsbsmcliciaSchema(many=True)
