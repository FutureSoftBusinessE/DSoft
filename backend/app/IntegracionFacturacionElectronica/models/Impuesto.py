from decimal import Decimal


class Impuesto:

    def __init__(self):
        self.codigo = ""
        self.codigoPorcentaje = ""
        self.tarifa = Decimal("0.00")
        self.baseImponible = Decimal("0.00")
        self.valor = Decimal("0.00")

    def getCodigo(self):
        return self.codigo

    def setCodigo(self, codigo):
        self.codigo = codigo

    def getCodigoPorcentaje(self):
        return self.codigoPorcentaje

    def setCodigoPorcentaje(self, codigoPorcentaje):
        self.codigoPorcentaje = codigoPorcentaje

    def getTarifa(self):
        return self.tarifa

    def setTarifa(self, tarifa):
        self.tarifa = tarifa

    def getBaseImponible(self):
        return self.baseImponible

    def setBaseImponible(self, baseImponible):
        self.baseImponible = baseImponible

    def getValor(self):
        return self.valor

    def setValor(self, valor):
        self.valor = valor
