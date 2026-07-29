# flake8: noqa
from app.extensions import db
from app.extensions import ma


class fsbsmcliusu(db.Model):
    __tablename__ = "fsbsmcliusu"
    __table_args__ = {"schema": "DSOFT.dbo"}
    cliciausu = db.Column(db.String(100), primary_key=True)
    cliciagrupo = db.Column(db.String(50), primary_key=True)
    cliciaidenti = db.Column(db.Numeric, primary_key=True)
    cliciausustatus = db.Column(db.String(100))
    cliusufecisys = db.Column(db.DateTime)
    cliusufecmsys = db.Column(db.DateTime)
    cliusuusuisys = db.Column(db.String(60))
    cliusuusumsys = db.Column(db.String(60))
    cliusuestisys = db.Column(db.String(60))
    cliusuestmsys = db.Column(db.String(60))

    def __init__(
        self,
        cliciausu,
        cliciagrupo,
        cliciaidenti,
        cliciausustatus,
        cliusufecisys,
        cliusufecmsys,
        cliusuusuisys,
        cliusuusumsys,
        cliusuestisys,
        cliusuestmsys,
    ):
        self.cliciausu = cliciausu
        self.cliciagrupo = cliciagrupo
        self.cliciaidenti = cliciaidenti
        self.cliciausustatus = cliciausustatus
        self.cliusufecisys = cliusufecisys
        self.cliusufecmsys = cliusufecmsys
        self.cliusuusuisys = cliusuusuisys
        self.cliusuusumsys = cliusuusumsys
        self.cliusuestisys = cliusuestisys
        self.cliusuestmsys = cliusuestmsys

    # def __repr__(self):
    #     return f'<Post "{self.cliciausu}">'


class fsbsmcliusuSchema(ma.Schema):
    class Meta:
        fields = (
            "cliciausu",
            "cliciagrupo",
            "cliciaidenti",
            "cliciausustatus",
            "cliusufecisys",
            "cliusufecmsys",
            "cliusuusuisys",
            "cliusuusumsys",
            "cliusuestisys",
            "cliusuestmsys",
        )


fsbsmcliusu_schema = fsbsmcliusuSchema()
fsbsmcliusu_schema_varios = fsbsmcliusuSchema(many=True)
