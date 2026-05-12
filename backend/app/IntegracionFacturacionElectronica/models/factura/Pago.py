from decimal import Decimal


class Pago:

    def __init__(self):
        self.formaPago = ""  # Código tabla 24 SRI
        self.total = Decimal("0.00")
        self.plazo = ""  # Opcional
        self.unidadTiempo = ""  # Opcional: dias, meses

    def getFormaPago(self):
        return self.formaPago

    def setFormaPago(self, formaPago):
        self.formaPago = formaPago

    def getTotal(self):
        return self.total

    def setTotal(self, total):
        self.total = total

    def getPlazo(self):
        return self.plazo

    def setPlazo(self, plazo):
        self.plazo = plazo

    def getUnidadTiempo(self):
        return self.unidadTiempo

    def setUnidadTiempo(self, unidadTiempo):
        self.unidadTiempo = unidadTiempo
