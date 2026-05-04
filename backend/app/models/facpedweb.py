# flake8: noqa
from marshmallow import fields
from sqlalchemy import Index
from app.extensions import db
from app.extensions import ma


class Facpedweb(db.Model):
    __tablename__ = "facpedweb"

    ciacodigo = db.Column(db.String, primary_key=True)
    pednumped = db.Column(db.String, primary_key=True)
    loccodigo = db.Column(db.String, primary_key=True)
    vencodigo = db.Column(db.String)
    clinombre = db.Column(db.String)
    pedfecemi = db.Column(db.DateTime)
    pedfecven = db.Column(db.DateTime)
    pedtivacer = db.Column(db.Numeric)
    pedtivapor = db.Column(db.Numeric)
    pedsubtot = db.Column(db.Numeric)
    pedpordes = db.Column(db.Numeric)
    peddesglobal = db.Column(db.Numeric)
    peddesdirecto = db.Column(db.Numeric)
    pedporiva = db.Column(db.Numeric)
    pedapliiva = db.Column(db.Integer)
    pediva = db.Column(db.Numeric)
    pedtotal = db.Column(db.Numeric)
    pedstatus = db.Column(db.String)
    pedfecisys = db.Column(db.DateTime)
    pedhorisys = db.Column(db.DateTime)
    pedusuisys = db.Column(db.String)
    pedestisys = db.Column(db.String)

    # Agregar un Ã­ndice a la columna pednumped
    # __table_args__ = (
    #     Index('_dta_index_facped_7_2106646748__K1_K72_K8_K71_K88_K6_K30_K31_K2_3_4_5_7_9_10_11_12_13_14_15_16_17_18_19_20_21_22_23_24_25_26_',
    #         loccodigo,facnumfac,pedtipo,moncodigo,garcodigo,peddirent,pedcambio,pedfecemi,pedfecven,pedtivacer,pedtivapor,pedsubtot,pediva,pedtotal,pedstatus,peddetalle,pedfecisys,pedhorisys,pedusuisys,pedestisys,pedfecmsys,pedhormsys,pedusumsys,pedestmsys,pedusudes,pedpordes,peddesglobal,peddesdirecto,pedrecargo,tipcodigo,pedporrec,pedporiva,pedvalantici,forintmen,pedvalinter,fordias,fortipo,forcuotas,foraplianti,foranticipo,foraplirango,formondesde,formonhasta,forapligrac,fordiasgrac,forcuoinigr,pedusuanti,codcodigo,adinumero,pednumadi,pedvaladi,pedapliiva,pedconser,pedlockser,pedvehi,foraprocredito,foraprologistica,foraprocliente,pedaprocredito,pedaprologistica,pedaprocliente,pedproyecto,pedsolsinstock,pedsinstock,forpromocion,fordescuento,regcodigo,procodigo,prosecuen,ciacodigo,proyectocodigo,clicodigo,integracodigo,ciucodigo,factippag,vencodigo,zoncodigo,pednumped),
    # )


class FacpedSchema(ma.SQLAlchemyAutoSchema):
    # pedfecemi  = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedfecven  = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedfecisys = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedhorisys = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedfecmsys = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedhormsys = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedfecaped = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedhoraped = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedfecapro = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')
    # pedhorapro = fields.DateTime(format='%Y-%m-%d %H:%M:%S.%f')

    class Meta:
        model = Facpedweb
