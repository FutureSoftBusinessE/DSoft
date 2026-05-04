# flake8: noqa
from flask import Blueprint

bp = Blueprint("productos", __name__)


from app.productos import routes
from app.productos.rutas import get_producto_por_codigo
from app.productos.rutas import obtener_items
from app.productos.rutas import obtener_productos
from app.productos.rutas import obtener_viewProductos_x_pagina
from app.productos.rutas import obtener_viewProductos
from app.productos.rutas import get_productos_fichas
from app.productos.rutas import getListImages
from app.productos.rutas import addNewImage
from app.productos.rutas import editSpecificImage
from app.productos.rutas import deleteSpecificImage
from app.productos.rutas import checkProductoBodega
