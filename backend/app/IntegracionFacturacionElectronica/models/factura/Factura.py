class Factura:

    def __init__(self):
        self.id = "comprobante"
        self.version = "1.1.0"
        self.infoTributaria = None  # InfoTributaria
        self.infoFactura = None  # InfoFactura
        self.detalle = []  # List[FacturaDetalle]
        self.campoAdicional = []  # List[CampoAdicional]
        self.retencion = []  # List[RetencionFactura]

    def getId(self):
        return self.id

    def setId(self, id):
        self.id = id

    def getVersion(self):
        return self.version

    def setVersion(self, version):
        self.version = version

    def getInfoTributaria(self):
        return self.infoTributaria

    def setInfoTributaria(self, infoTributaria):
        self.infoTributaria = infoTributaria

    def getInfoFactura(self):
        return self.infoFactura

    def setInfoFactura(self, infoFactura):
        self.infoFactura = infoFactura

    def getDetalle(self):
        return self.detalle

    def setDetalle(self, detalle):
        self.detalle = detalle

    def getCampoAdicional(self):
        return self.campoAdicional

    def setCampoAdicional(self, campoAdicional):
        self.campoAdicional = campoAdicional

    def getRetencion(self):
        return self.retencion

    def setRetencion(self, retencion):
        self.retencion = retencion
