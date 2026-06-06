from flask import Blueprint


bp = Blueprint("solicitudDeIngreso", __name__)

from app.solicitudDeIngreso.rutas import getImagesxArtcodigo
from app.solicitudDeIngreso.rutas import ayudaProveedor
from app.solicitudDeIngreso.rutas import ayudaCliente
from app.solicitudDeIngreso.rutas import ayudaProducto
from app.solicitudDeIngreso.rutas import generarNumSecuencia
from app.solicitudDeIngreso.rutas import crearSolicitudDeIngreso
from app.solicitudDeIngreso.rutas import getAllFiltros
from app.solicitudDeIngreso.rutas import getArticuloDescrixArtCodigo
from app.solicitudDeIngreso.rutas import getSolicitudesXFiltro
from app.solicitudDeIngreso.rutas import verificarIngresoProducto
from app.solicitudDeIngreso.rutas import getArticulosPorSolIng
from app.solicitudDeIngreso.rutas import deleteProductosSolIng
from app.solicitudDeIngreso.rutas import updateProductosSolIng
from app.solicitudDeIngreso.rutas import getCodProveedor
from app.solicitudDeIngreso.rutas import getCodCliente
from app.solicitudDeIngreso.rutas import getAllClientes
from app.solicitudDeIngreso.rutas import getAllProveedores
from app.solicitudDeIngreso.rutas import getProductosXCliente
from app.solicitudDeIngreso.rutas import getProveedoresBusqueda
from app.solicitudDeIngreso.rutas import getProductosBusqueda
from app.solicitudDeIngreso.rutas import getSolicitudDeIngreso
from app.solicitudDeIngreso.rutas import getCod2ArticuloXCliente
