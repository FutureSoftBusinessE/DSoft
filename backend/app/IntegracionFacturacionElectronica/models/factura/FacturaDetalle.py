from decimal import Decimal


class FacturaDetalle:

    def __init__(self):
        self.codigoPrincipal = ""
        self.codigoAuxiliar = ""
        self.descripcion = ""
        self.cantidad = Decimal("0.00")
        self.precioUnitario = Decimal("0.00")
        self.descuento = Decimal("0.00")
        self.precioTotalSinImpuesto = Decimal("0.00")
        self.detAdicional = []  # List[DetAdicional]
        self.impuesto = []  # List[Impuesto]

    def getCodigoPrincipal(self):
        return self.codigoPrincipal

    def setCodigoPrincipal(self, codigoPrincipal):
        self.codigoPrincipal = codigoPrincipal

    def getCodigoAuxiliar(self):
        return self.codigoAuxiliar

    def setCodigoAuxiliar(self, codigoAuxiliar):
        self.codigoAuxiliar = codigoAuxiliar

    def getDescripcion(self):
        return self.descripcion

    def setDescripcion(self, descripcion):
        self.descripcion = descripcion

    def getCantidad(self):
        return self.cantidad

    def setCantidad(self, cantidad):
        self.cantidad = cantidad

    def getPrecioUnitario(self):
        return self.precioUnitario

    def setPrecioUnitario(self, precioUnitario):
        self.precioUnitario = precioUnitario

    def getDescuento(self):
        return self.descuento

    def setDescuento(self, descuento):
        self.descuento = descuento

    def getPrecioTotalSinImpuesto(self):
        return self.precioTotalSinImpuesto

    def setPrecioTotalSinImpuesto(self, precioTotalSinImpuesto):
        self.precioTotalSinImpuesto = precioTotalSinImpuesto

    def getDetAdicional(self):
        return self.detAdicional

    def setDetAdicional(self, detAdicional):
        self.detAdicional = detAdicional

    def getImpuesto(self):
        return self.impuesto

    def setImpuesto(self, impuesto):
        self.impuesto = impuesto
