# flake8: noqa
# Cgblocal
from app.extensions import db
from app.extensions import ma


class CgblocalP(db.Model):
    __tablename__ = "cgblocal"
    __table_args__ = {"schema": "SiacMercatti.dbo"}
    # schema = 'SiacPracticasa.dbo'
    locdescri = db.Column(db.String(200))
    loccodigo = db.Column(db.String(2), primary_key=True)
    ciacodigo = db.Column(db.String(2), primary_key=True)
    locstatus = db.Column(db.String(1))


class CgblocalPSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = CgblocalP


from app.extensions import db

# class Siactloc(db.Model):
#     _tablename_ = 'siactloc'
#     ciacodigo = db.Column(db.String(2), primary_key=True)
#     usrcodigo = db.Column(db.String(10), primary_key=True)
#     loccodigo = db.Column(db.String(3), primary_key=True)
#     # ... otras columnas ...

# def get_localidad():
#     data = request.get_json() if request.is_json else None
#     cliciausu = encriptar(data['user'])
#     seleccion = data['seleccion']
#     clicianonBD = seleccion['clicianonBD']

#     class DynamicSiactloc(Siactloc):
#         _table_args_ = {'schema': clicianonBD}

#     results = db.session.query(
#         Cgblocal.locdescri, Cgblocal.loccodigo
#     ).join(
#         DynamicSiactloc, DynamicSiactloc.ciacodigo == Cgblocal.ciacodigo
#     ).filter(
#         DynamicSiactloc.ciacodigo == ciacodigo,
#         DynamicSiactloc.usrcodigo == cliciausu,
#         Cgblocal.locstatus == 'A'
#     ).distinct().all()


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
