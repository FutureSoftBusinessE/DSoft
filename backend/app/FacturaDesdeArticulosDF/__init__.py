# flake8: noqa
from flask import Blueprint


bp = Blueprint("FacturaDesdeArticulosDF", __name__)


# from app.filter import get_filter
from app.FacturaDesdeArticulosDF import getArticulosConImagen
from app.FacturaDesdeArticulosDF import getCliente
from app.FacturaDesdeArticulosDF import getTOP30Articulos
from app.FacturaDesdeArticulosDF import getSpecificArticulo
from app.FacturaDesdeArticulosDF import getArticuloXCodBarras
from app.FacturaDesdeArticulosDF import getInfoCliente
from app.FacturaDesdeArticulosDF import agenciaXCliente
from app.FacturaDesdeArticulosDF import getAllFacturas
from app.FacturaDesdeArticulosDF import guardarPedido
from app.FacturaDesdeArticulosDF import get_forma_pago
from app.FacturaDesdeArticulosDF import generarCodigoTemporal
from app.FacturaDesdeArticulosDF import getVendedores
from app.FacturaDesdeArticulosDF import facturarProforma
from app.FacturaDesdeArticulosDF import recuperarPayloadFactura
from app.FacturaDesdeArticulosDF import getProforma
from app.FacturaDesdeArticulosDF import editarPedido
from app.FacturaDesdeArticulosDF import getProformaFacturaBuscar
from app.FacturaDesdeArticulosDF import getCajas
from app.FacturaDesdeArticulosDF import getFacturaParaClonar
from app.FacturaDesdeArticulosDF import anularFactura

from app.FacturaDesdeArticulosDF.utils import construir_payload_sri
