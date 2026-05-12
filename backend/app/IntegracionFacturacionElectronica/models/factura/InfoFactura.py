from decimal import Decimal


class InfoFactura:

    def __init__(self):
        self.fechaEmision = ""
        self.dirEstablecimiento = ""
        self.contribuyenteEspecial = ""
        self.contribuyenteEspecial = ""
        self.obligadoContabilidad = ""
        self.tipoIdentificacionComprador = ""
        self.guiaRemision = ""
        self.razonSocialComprador = ""
        self.identificacionComprador = ""
        self.totalSinImpuestos = Decimal("0.00")
        self.totalDescuento = Decimal("0.00")
        self.totalImpuesto = []  # List[TotalImpuesto]
        self.propina = Decimal("0.00")
        self.importeTotal = Decimal("0.00")
        self.moneda = ""
        self.pagos = []  # List[Pago]

    def getFechaEmision(self):
        return self.fechaEmision

    def setFechaEmision(self, fechaEmision):
        self.fechaEmision = fechaEmision

    def getDirEstablecimiento(self):
        return self.dirEstablecimiento

    def setDirEstablecimiento(self, dirEstablecimiento):
        self.dirEstablecimiento = dirEstablecimiento

    def getContribuyenteEspecial(self):
        return self.contribuyenteEspecial

    def setContribuyenteEspecial(self, contribuyenteEspecial):
        self.contribuyenteEspecial = contribuyenteEspecial

    def getObligadoContabilidad(self):
        return self.obligadoContabilidad

    def setObligadoContabilidad(self, obligadoContabilidad):
        self.obligadoContabilidad = obligadoContabilidad

    def getTipoIdentificacionComprador(self):
        return self.tipoIdentificacionComprador

    def setTipoIdentificacionComprador(self, tipoIdentificacionComprador):
        self.tipoIdentificacionComprador = tipoIdentificacionComprador

    def getGuiaRemision(self):
        return self.guiaRemision

    def setGuiaRemision(self, guiaRemision):
        self.guiaRemision = guiaRemision

    def getRazonSocialComprador(self):
        return self.razonSocialComprador

    def setRazonSocialComprador(self, razonSocialComprador):
        self.razonSocialComprador = razonSocialComprador

    def getIdentificacionComprador(self):
        return self.identificacionComprador

    def setIdentificacionComprador(self, identificacionComprador):
        self.identificacionComprador = identificacionComprador

    def getTotalSinImpuestos(self):
        return self.totalSinImpuestos

    def setTotalSinImpuestos(self, totalSinImpuestos):
        self.totalSinImpuestos = totalSinImpuestos

    def getTotalDescuento(self):
        return self.totalDescuento

    def setTotalDescuento(self, totalDescuento):
        self.totalDescuento = totalDescuento

    def getTotalImpuesto(self):
        return self.totalImpuesto

    def setTotalImpuesto(self, totalImpuesto):
        self.totalImpuesto = totalImpuesto

    def getPropina(self):
        return self.propina

    def setPropina(self, propina):
        self.propina = propina

    def getImporteTotal(self):
        return self.importeTotal

    def setImporteTotal(self, importeTotal):
        self.importeTotal = importeTotal

    def getMoneda(self):
        return self.moneda

    def setMoneda(self, moneda):
        self.moneda = moneda

    def getPagos(self):
        return self.pagos

    def setPagos(self, pagos):
        self.pagos = pagos
