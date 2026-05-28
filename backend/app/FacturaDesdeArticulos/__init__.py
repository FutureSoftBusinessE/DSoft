# flake8: noqa
from flask import Blueprint
from flask_cors import CORS

bp = Blueprint("FacturaDesdeArticulos", __name__)
cors = CORS(bp, resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}})


# from app.filter import get_filter
from app.FacturaDesdeArticulos import getArticulosConImagen
from app.FacturaDesdeArticulos import getCliente
from app.FacturaDesdeArticulos import getTOP30Articulos
from app.FacturaDesdeArticulos import getSpecificArticulo
from app.FacturaDesdeArticulos import getArticuloXCodBarras
from app.FacturaDesdeArticulos import getInfoCliente
from app.FacturaDesdeArticulos import agenciaXCliente
from app.FacturaDesdeArticulos import getAllFacturas
from app.FacturaDesdeArticulos import guardarPedido
from app.FacturaDesdeArticulos import get_forma_pago
from app.FacturaDesdeArticulos import generarCodigoTemporal
from app.FacturaDesdeArticulos import getVendedores
from app.FacturaDesdeArticulos import getProforma
from app.FacturaDesdeArticulos import editarProforma
from app.FacturaDesdeArticulos import deleteProforma


from app.FacturaDesdeArticulos import recuperarPayloadFactura
from app.FacturaDesdeArticulos.utils import construir_payload_sri
from app.FacturaDesdeArticulos import facturarProforma
