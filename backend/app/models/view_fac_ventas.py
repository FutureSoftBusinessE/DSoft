# flake8: noqa
from app.extensions import db, PrimaryKeyConstraint
from app.extensions import ma


class ViewFacVentas(db.Model):
    __tablename__ = "view_fac_ventas"

    ciacodigo = db.Column(db.String)
    ususys = db.Column(db.String)
    documento = db.Column(db.String)
    referencia = db.Column(db.String)
    secuencia = db.Column(db.String)
    emision = db.Column(db.DateTime)
    clicodigo = db.Column(db.String)
    clinombre = db.Column(db.String)
    factipo = db.Column(db.String)
    factippag = db.Column(db.String)
    facstatus = db.Column(db.String)
    moncodigo = db.Column(db.String)
    cantidad = db.Column(db.Float)
    precio = db.Column(db.Float)
    ventabruta = db.Column(db.Float)
    descuentos = db.Column(db.Float)
    iva = db.Column(db.Float)
    costo = db.Column(db.Float)
    interes = db.Column(db.Float)
    recargo = db.Column(db.Float)
    facvaltot = db.Column(db.Float)
    vencodigo = db.Column(db.String)
    vendescri = db.Column(db.String)
    loccodigo = db.Column(db.String)
    locdescri = db.Column(db.String)
    invcodigo = db.Column(db.String)
    bodcodigo = db.Column(db.String)
    boddescri = db.Column(db.String)
    artcodigo = db.Column(db.String)
    artdescri = db.Column(db.String)
    lincodigo = db.Column(db.String)
    lindescri = db.Column(db.String)
    marcodigo = db.Column(db.String)
    mardescri = db.Column(db.String)
    precodigo = db.Column(db.String)
    zoncodigo = db.Column(db.String)
    zondescri = db.Column(db.String)
    medcodigo = db.Column(db.String)
    invdescri = db.Column(db.String)
    sriautnumero = db.Column(db.String)
    activicodigo = db.Column(db.String)
    actividescri = db.Column(db.String)
    sectorcodigo = db.Column(db.String)
    sectordescri = db.Column(db.String)
    fordescri = db.Column(db.String)
    costocomision = db.Column(db.Float)
    lindescrimayor = db.Column(db.String)
    jefecodigo = db.Column(db.String)
    tipcodigo = db.Column(db.String)
    proyectocodigo = db.Column(db.String)
    proyectodescri = db.Column(db.String)
    fordias = db.Column(db.Float)
    artservicio = db.Column(db.Float)
    artcodigo2 = db.Column(db.String)
    esExplo = db.Column(db.Float)
    cliprecio = db.Column(db.Float)

    def __init__(
        self,
        ciacodigo,
        ususys,
        documento,
        referencia,
        secuencia,
        emision,
        clicodigo,
        clinombre,
        factipo,
        factippag,
        facstatus,
        moncodigo,
        cantidad,
        precio,
        ventabruta,
        descuentos,
        iva,
        costo,
        interes,
        recargo,
        facvaltot,
        vencodigo,
        vendescri,
        loccodigo,
        locdescri,
        invcodigo,
        bodcodigo,
        boddescri,
        artcodigo,
        artdescri,
        lincodigo,
        lindescri,
        marcodigo,
        mardescri,
        precodigo,
        zoncodigo,
        zondescri,
        medcodigo,
        invdescri,
        sriautnumero,
        activicodigo,
        actividescri,
        sectorcodigo,
        sectordescri,
        fordescri,
        costocomision,
        lindescrimayor,
        jefecodigo,
        tipcodigo,
        proyectocodigo,
        proyectodescri,
        fordias,
        artservicio,
        artcodigo2,
        esExplo,
        cliprecio,
    ):
        self.ciacodigo = ciacodigo
        self.ususys = ususys
        self.documento = documento
        self.referencia = referencia
        self.secuencia = secuencia
        self.emision = emision
        self.clicodigo = clicodigo
        self.clinombre = clinombre
        self.factipo = factipo
        self.factippag = factippag
        self.facstatus = facstatus
        self.moncodigo = moncodigo
        self.cantidad = cantidad
        self.precio = precio
        self.ventabruta = ventabruta
        self.descuentos = descuentos
        self.iva = iva
        self.costo = costo
        self.interes = interes
        self.recargo = recargo
        self.facvaltot = facvaltot
        self.vencodigo = vencodigo
        self.vendescri = vendescri
        self.loccodigo = loccodigo
        self.locdescri = locdescri
        self.invcodigo = invcodigo
        self.bodcodigo = bodcodigo
        self.boddescri = boddescri
        self.artcodigo = artcodigo
        self.artdescri = artdescri
        self.lincodigo = lincodigo
        self.lindescri = lindescri
        self.marcodigo = marcodigo
        self.mardescri = mardescri
        self.precodigo = precodigo
        self.zoncodigo = zoncodigo
        self.zondescri = zondescri
        self.medcodigo = medcodigo
        self.invdescri = invdescri
        self.sriautnumero = sriautnumero
        self.activicodigo = activicodigo
        self.actividescri = actividescri
        self.sectorcodigo = sectorcodigo
        self.sectordescri = sectordescri
        self.fordescri = fordescri
        self.costocomision = costocomision
        self.lindescrimayor = lindescrimayor
        self.jefecodigo = jefecodigo
        self.tipcodigo = tipcodigo
        self.proyectocodigo = proyectocodigo
        self.proyectodescri = proyectodescri
        self.fordias = fordias
        self.artservicio = artservicio
        self.artcodigo2 = artcodigo2
        self.esExplo = esExplo
        self.cliprecio = cliprecio

    __table_args__ = (PrimaryKeyConstraint("ciacodigo", "invcodigo", "artcodigo", name="pk_fac_ventas"),)


class ViewFacVentasSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ViewFacVentas
