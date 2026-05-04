# flake8: noqa
# Cgblocal
from app.extensions import db
from app.extensions import ma


class Cgblocal(db.Model):
    __tablename__ = "cgblocal"
    # __table_args__ = {'schema': 'SiacPracticasa.dbo'}
    ciacodigo = db.Column(db.String(2), primary_key=True)
    loccodigo = db.Column(db.String(2), primary_key=True)
    locdescri = db.Column(db.String(200), nullable=False)
    locstatus = db.Column(db.String(1), nullable=False)
    locfecisys = db.Column(db.DateTime, nullable=False)
    lochorisys = db.Column(db.DateTime, nullable=False)
    locusuisys = db.Column(db.String(10), nullable=False)
    locfecmsys = db.Column(db.DateTime, nullable=False)
    lochormsys = db.Column(db.DateTime, nullable=False)
    locusumsys = db.Column(db.String(10), nullable=False)
    ttrcodigo = db.Column(db.String(3))
    seqcodigo = db.Column(db.String(3))
    sercesion = db.Column(db.String(3))
    factippag = db.Column(db.String(3))
    secndmig = db.Column(db.String(3))
    secncmig = db.Column(db.String(3))
    ndfcodigo = db.Column(db.String(3))
    ciaruc = db.Column(db.String(15))
    ciadirec = db.Column(db.String(200), nullable=False)
    ciaciudad = db.Column(db.String(30))
    ciapais = db.Column(db.String(30))
    ciatelefono1 = db.Column(db.String(15))
    ciatelefono2 = db.Column(db.String(15))
    ciafax = db.Column(db.String(15))
    ciaemail = db.Column(db.String(70))
    ciaseccobfac = db.Column(db.String(3))
    ciaseccobdoc = db.Column(db.String(3))
    ciasecinvnc = db.Column(db.String(3))
    fafaccob = db.Column(db.Integer, default=0, nullable=False)
    fadesglobal = db.Column(db.Integer, default=0, nullable=False)
    fatrainv = db.Column(db.String(3))
    fasumadesc = db.Column(db.String(1))
    fanumlin = db.Column(db.Integer, default=0, nullable=False)
    fatraanu = db.Column(db.String(3))
    famimpser = db.Column(db.Integer, default=0, nullable=False)
    famporser = db.Column(db.Numeric(18, 2), default=0, nullable=False)
    famrecporval = db.Column(db.Integer, default=0, nullable=False)
    fampor1 = db.Column(db.Numeric(18, 2), default=0, nullable=False)
    tipcodigo = db.Column(db.String(3))
    forpagnd = db.Column(db.String(3))
    vencodigo = db.Column(db.String(3))
    zoncodigo = db.Column(db.String(3))
    ncfcodigo = db.Column(db.String(3))
    repbodcod = db.Column(db.String(3))
    seqantdocgar = db.Column(db.String(3))
    cablin1 = db.Column(db.String(80))
    cablin2 = db.Column(db.String(80))
    cablin3 = db.Column(db.String(80))
    cablin4 = db.Column(db.String(80))
    pielin1 = db.Column(db.String(80))
    pielin2 = db.Column(db.String(80))
    pielin3 = db.Column(db.String(80))
    pielin4 = db.Column(db.String(80))
    parfecven = db.Column(db.Integer, default=0, nullable=False)
    pardiasven = db.Column(db.Numeric(6, 2), default=0, nullable=False)
    unicodigo = db.Column(db.String(3))
    procodigo = db.Column(db.String(3))
    regcodigo = db.Column(db.String(3))
    bodcodpro = db.Column(db.String(3))
    invcodpro = db.Column(db.String(2))
    pacodingre = db.Column(db.String(3))
    pacodegre = db.Column(db.String(3))
    pacodingdev = db.Column(db.String(3))
    pacodegprest = db.Column(db.String(3))
    pacodinggar = db.Column(db.String(3))
    pacodegrgar = db.Column(db.String(3))
    pacodegrpro = db.Column(db.String(3))
    painvcodgar = db.Column(db.String(2))
    pabodcodgar = db.Column(db.String(3))
    seqcodigonc = db.Column(db.String(3))
    sercodigo = db.Column(db.String(3))
    tracodproing = db.Column(db.String(3))
    tracodproegr = db.Column(db.String(3))
    seqcodigondm = db.Column(db.String(3))
    sercodigondm = db.Column(db.String(3))
    invemiped = db.Column(db.String(2))
    forpagun = db.Column(db.String(3))
    cencosun = db.Column(db.String(30))
    tipordcom = db.Column(db.String(3))
    tipclipro = db.Column(db.String(3))
    probodcod = db.Column(db.String(3))
    propormano = db.Column(db.Numeric(6, 2), default=0.00, nullable=False)
    proporrepuesto = db.Column(db.Numeric(6, 2), default=0.00, nullable=False)
    tipordcomser = db.Column(db.String(3))
    seqndref = db.Column(db.String(3))
    seqncmref = db.Column(db.String(3))
    seqcobref = db.Column(db.String(3))
    serndref = db.Column(db.String(3))
    serncintref = db.Column(db.String(3))
    serncref = db.Column(db.String(3))
    paramcod1 = db.Column(db.String(3))
    paramcod2 = db.Column(db.String(3))
    paramcod3 = db.Column(db.String(3))
    paramcod4 = db.Column(db.String(3))
    paramcod5 = db.Column(db.String(3))
    paramcod6 = db.Column(db.String(3))
    paramval1 = db.Column(db.Numeric(16, 2), default=0.00)
    paramval2 = db.Column(db.Numeric(16, 2), default=0.00)
    paramval3 = db.Column(db.Numeric(16, 2), default=0.00)
    paramval4 = db.Column(db.Numeric(16, 2), default=0.00)
    paramval5 = db.Column(db.Numeric(16, 2), default=0.00)
    paramval6 = db.Column(db.Numeric(16, 2), default=0.00)
    tracodingloc = db.Column(db.String(3))
    locfecinicxc = db.Column(db.DateTime)
    clicodingprod = db.Column(db.String(6))
    procodingprod = db.Column(db.String(6))
    flagapruanti = db.Column(db.Integer, default=0)
    feccorpedveh = db.Column(db.DateTime)
    seqcesion = db.Column(db.String(3))
    ciaprovincia = db.Column(db.String(30))
    tarseqnd = db.Column(db.String(3))
    tarforpag = db.Column(db.String(3))
    tarser00 = db.Column(db.String(3))
    tarrecau = db.Column(db.String(3))
    tarser01 = db.Column(db.String(3))
    tarser02 = db.Column(db.String(3))
    tarser03 = db.Column(db.String(3))
    tarser04 = db.Column(db.String(3))
    tarseqndint = db.Column(db.String(3))
    tarserint = db.Column(db.String(3))
    tarforpagint = db.Column(db.String(3))
    tarsecncrotdif = db.Column(db.String(3))
    tarserncrotdif = db.Column(db.String(3))
    tartiponccom = db.Column(db.String(3))
    tarsecncpuntos = db.Column(db.String(3))
    tarserncpuntos = db.Column(db.String(3))
    tarvalcomigen = db.Column(db.Numeric(12, 2), default=0)
    tarcanapligen = db.Column(db.Integer, default=0)
    tarvalcomiart = db.Column(db.Numeric(12, 2), default=0)
    tarcanapliart = db.Column(db.Integer, default=0)
    tarsecant = db.Column(db.String(3))
    tarseccob = db.Column(db.String(3))
    cjacodigonc = db.Column(db.String(3))
    tardiasventrans = db.Column(db.Integer, default=0, nullable=False)
    emailsmtp = db.Column(db.String(100))
    emailmascara = db.Column(db.String(50))
    emailsalida = db.Column(db.String(100))
    emailtema = db.Column(db.String(50))
    emailmensaje = db.Column(db.Text)
    locpathxml = db.Column(db.String(255))
    prescodigo = db.Column(db.String(3))
    presaplicaquin = db.Column(db.Integer, default=0, nullable=False)
    presaplicamens = db.Column(db.Integer, default=0, nullable=False)
    prestipcliempl = db.Column(db.String(3))
    presseccobro = db.Column(db.String(3))
    pressecncmon = db.Column(db.String(3))
    presserncmon = db.Column(db.String(3))
    sertarpos = db.Column(db.String(3))
    tipoingoc = db.Column(db.String(3))
    tipoegroc = db.Column(db.String(3))
    diasvenoc = db.Column(db.Integer, default=0)
    secantoc = db.Column(db.String(3))
    valorminimooc = db.Column(db.Numeric(18, 2))
    locservidor = db.Column(db.String(1), nullable=False)
    guianumlin = db.Column(db.Integer, default=0, nullable=False)
    locpathxmldocemitidos = db.Column(db.String(255))
    locpathxmldocanulados = db.Column(db.String(255))
    ciucodigo = db.Column(db.String(3))
    activicodigo = db.Column(db.String(3))
    sectorcodigo = db.Column(db.String(3))
    clivendedor = db.Column(db.String(3))
    tbliqcaja = db.Column(db.String(3))
    tbliqviatico = db.Column(db.String(3))
    traegrped = db.Column(db.String(3))
    traingped = db.Column(db.String(3))
    bcoliqviatico = db.Column(db.String(3))
    notapedido1 = db.Column(db.String(1000))
    notapedido2 = db.Column(db.String(1000))
    notaoc = db.Column(db.String(1000))
    invtrapresegr = db.Column(db.String(3), default="")
    invtrapresing = db.Column(db.String(3), default="")
    sercodigotransporte = db.Column(db.String(15))
    notacertificado = db.Column(db.String(1000))
    clavep12 = db.Column(db.String(60))
    paramcoding = db.Column(db.String(3))
    paramtipond = db.Column(db.String(3))
    paramtiponc = db.Column(db.String(3))
    paramstnd = db.Column(db.String(2))
    paramstnc = db.Column(db.String(2))
    paramtcnd = db.Column(db.String(6))
    paramtcnc = db.Column(db.String(6))
    parambodingegr = db.Column(db.String(3))
    ctaivapagadobien = db.Column(db.String(30))
    ctaivapagadoserv = db.Column(db.String(30))
    emailsubject = db.Column(db.String(100))
    caducidadp12 = db.Column(db.DateTime)
    locflagcupon = db.Column(db.Integer, default=0, nullable=False)
    locvalcupon = db.Column(db.Numeric(12, 2), default=0, nullable=False)
    locfecinicupon = db.Column(db.DateTime)
    locfecfincupon = db.Column(db.DateTime)
    parrocodigo = db.Column(db.String(6))
    clidiascrs = db.Column(db.Integer, default=0, nullable=False)
    climontocrs = db.Column(db.Numeric(18, 2), default=0, nullable=False)


class CgblocalSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Cgblocal


# ciacodigo
# loccodigo
# locdescri
# locstatus
# locfecisys
# lochorisys
# locusuisys
# locfecmsys
# lochormsys
# locusumsys
# ttrcodigo
# seqcodigo
# sercesion
# factippag
# secndmig
# secncmig
# ndfcodigo
# ciaruc
# ciadirec
# ciaciudad
# ciapais
# ciatelefono1
# ciatelefono2
# ciafax
# ciaemail
# ciaseccobfac
# ciaseccobdoc
# ciasecinvnc
# fafaccob
# fadesglobal
# fatrainv
# fasumadesc
# fanumlin
# fatraanu
# famimpser
# famporser
# famrecporval
# fampor1
# tipcodigo
# forpagnd
# vencodigo
# zoncodigo
# ncfcodigo
# repbodcod
# seqantdocgar
# cablin1
# cablin2
# cablin3
# cablin4
# pielin1
# pielin2
# pielin3
# pielin4
# parfecven
# pardiasven
# unicodigo
# procodigo
# regcodigo
# bodcodpro
# invcodpro
# pacodingre
# pacodegre
# pacodingdev
# pacodegprest
# pacodinggar
# pacodegrgar
# pacodegrpro
# painvcodgar
# pabodcodgar
# seqcodigonc
# sercodigo
# tracodproing
# tracodproegr
# seqcodigondm
# sercodigondm
# invemiped
# forpagun
# cencosun
# tipordcom
# tipclipro
# probodcod
# propormano
# proporrepuesto
# tipordcomser
# seqndref
# seqncmref
# seqcobref
# serndref
# serncintref
# serncref
# paramcod1
# paramcod2
# paramcod3
# paramcod4
# paramcod5
# paramcod6
# paramval1
# paramval2
# paramval3
# paramval4
# paramval5
# paramval6
# tracodingloc
# locfecinicxc
# clicodingprod
# procodingprod
# flagapruanti
# feccorpedveh
# seqcesion
# ciaprovincia
# tarseqnd
# tarforpag
# tarser00
# tarrecau
# tarser01
# tarser02
# tarser03
# tarser04
# tarseqndint
# tarserint
# tarforpagint
# tarsecncrotdif
# tarserncrotdif
# tartiponccom
# tarsecncpuntos
# tarserncpuntos
# tarvalcomigen
# tarcanapligen
# tarvalcomiart
# tarcanapliart
# tarsecant
# tarseccob
# cjacodigonc
# tardiasventrans
# emailsmtp
# emailmascara
# emailsalida
# emailtema
# emailmensaje
# locpathxml
# prescodigo
# presaplicaquin
# presaplicamens
# prestipcliempl
# presseccobro
# pressecncmon
# presserncmon
# sertarpos
# tipoingoc
# tipoegroc
# diasvenoc
# secantoc
# valorminimooc
# locservidor
# guianumlin
# locpathxmldocemitidos
# locpathxmldocanulados
# ciucodigo
# activicodigo
# sectorcodigo
# clivendedor
# tbliqcaja
# tbliqviatico
# traegrped
# traingped
# bcoliqviatico
# notapedido1
# notapedido2
# notaoc
# invtrapresegr
# invtrapresing
# sercodigotransporte
# notacertificado
# clavep12
# paramcoding
# paramtipond
# paramtiponc
# paramstnd
# paramstnc
# paramtcnd
# paramtcnc
# parambodingegr
# ctaivapagadobien
# ctaivapagadoserv
# emailsubject
# caducidadp12
# locflagcupon
# locvalcupon
# locfecinicupon
# locfecfincupon
# parrocodigo
# clidiascrs
# climontocrs
