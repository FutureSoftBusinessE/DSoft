from flask import Blueprint


bp = Blueprint("CatalogodeProductos", __name__)

# APIS PARA EL CRUD

from app.CatalogodeProductos.rutas import createCatalogodeProductos
from app.CatalogodeProductos.rutas import eliminarCatalogodeProductos
from app.CatalogodeProductos.rutas import getAllCatalogodeProductos
from app.CatalogodeProductos.rutas import updateCatalogodeProductos
from app.CatalogodeProductos.rutas import validarCatalogodeProductosIMP
from app.CatalogodeProductos.rutas import insertarCatalogodeProductosIMP
from app.CatalogodeProductos.rutas import getListaBodegas
from app.CatalogodeProductos.rutas import getListaInventarios
from app.CatalogodeProductos.rutas import getListaJefes
from app.CatalogodeProductos.rutas import getLineasModalFull
from app.CatalogodeProductos.rutas import getListaMarcas
from app.CatalogodeProductos.rutas import getListaMedidas
from app.CatalogodeProductos.rutas import getListaPaises
from app.CatalogodeProductos.rutas import getListaPresentaciones
from app.CatalogodeProductos.rutas import getListaProveedores
from app.CatalogodeProductos.rutas import getListaArticulos
from app.CatalogodeProductos.rutas import getListaPrincipiosActivos
from app.CatalogodeProductos.rutas import getParametrosCia
from app.CatalogodeProductos.rutas import getSecuenciaArticulo
from app.CatalogodeProductos.rutas import getProductoId
from app.CatalogodeProductos.rutas import getProductoBuscar
