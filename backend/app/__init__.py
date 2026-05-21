# flake8: noqa
from flask import Flask, jsonify, send_file, send_from_directory
import os
from config import Config
import logging
from logging.handlers import TimedRotatingFileHandler
import os
from dotenv import load_dotenv
from decouple import config as config_env
import sys
from datetime import time
from error_handling import setup_error_handling
from error_handling.global_error_handlers import setup_global_error_handlers

# Cargar variables de entorno
load_dotenv()  # Carga .env por defecto


def create_app(config_class=Config):

    app = Flask(__name__, static_folder="../../frontend/build")

    # ************************************************************
    #                         LOGGER FLASK
    # ************************************************************
    current_env = config_env("APP_ENV")
    logs_enabled = config_env("APP_LOGS_ENABLED")

    # Configuración del logger (ejecutar solo una vez)
    if current_env == "production" or logs_enabled:
        try:
            log_path = config_env("APP_LOG_FLASK_PATH")
            # 1. Crear directorio si no existe
            log_dir = os.path.dirname(log_path)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir)

            # Formato común para ambos handlers
            formatter = logging.Formatter("[%(asctime)s] %(levelname)s " "| %(module)s:%(lineno)d | %(message)s")

            # 2. Handler principal para todos los niveles (INFO+)
            main_handler = TimedRotatingFileHandler(log_path, when="midnight", interval=1, backupCount=15, utc=False, atTime=time(0, 0, 0))  # Rotación diaria  # Cada 1 día  # Mantener 15 backups  # Usar hora local  # Medianoche (00:00:00)
            main_handler.setFormatter(formatter)

            # 3. Handler específico para errores
            error_handler = TimedRotatingFileHandler(f"{log_path}.errors", when="midnight", interval=1, backupCount=15, utc=False, atTime=time(0, 0, 0))  # Nombre distinto para errores  # Rotación diaria  # Cada 1 día  # Mantener 15 backups  # Usar hora local  # Medianoche (00:00:00)
            error_handler.setLevel(logging.ERROR)
            error_handler.setFormatter(formatter)

            # 4. Configurar niveles globales y añadir handlers
            app.logger.addHandler(main_handler)
            app.logger.addHandler(error_handler)
            app.logger.setLevel(logging.INFO)

            app.logger.info("Logger configurado exitosamente para producción")

        except Exception as e:
            # Fallback crítico usando logging básico
            logging.basicConfig(level=logging.ERROR, format="[%(asctime)s] CRITICAL: %(message)s", handlers=[logging.StreamHandler(sys.stderr)])
            logging.error(f"Error configurando logger: {str(e)}")

    app.config.from_object(config_class)

    app.config["JSON_SORT_KEYS"] = False

    # Initialize Flask extensions here

    from app.extensions import db

    db.init_app(app)

    from app.extensions import ma

    ma.init_app(app)

    from app.extensions import cors

    cors.init_app(
        app,
        resources={r"/*": {"origins": "*", "headers": ["Content-Type", "Authorization"]}},
    )

    from app.extensions import jwt

    jwt.init_app(app)
    # CONFIGURAR SISTEMA DE ERRORES POR API
    setup_error_handling(app)

    # CONFIGURAR SISTEMA DE ERRORES GLOBALES
    setup_global_error_handlers(app)
    # --------------------------------------

    # Register blueprints here

    # Register blueprints here

    from app.login import bp as login_bp

    app.register_blueprint(login_bp, url_prefix="/login")

    from app.menu import bp as login_bp

    app.register_blueprint(login_bp, url_prefix="/menu")

    from app.productos import bp as productos_bp

    app.register_blueprint(productos_bp, url_prefix="/productos")

    from app.linea import bp as linea_bp

    app.register_blueprint(linea_bp, url_prefix="/linea")

    from app.filter import bp as filter_bp

    app.register_blueprint(filter_bp, url_prefix="/filter")

    from app.FacturaDesdeArticulos import bp as FacturaDesdeArticulos_bp

    app.register_blueprint(FacturaDesdeArticulos_bp, url_prefix="/FacturaDesdeArticulos")

    from app.Home import bp as Home_bp

    app.register_blueprint(Home_bp, url_prefix="/Home")

    from app.CreacionUsuarios import bp as CreacionUsuarios_bp

    app.register_blueprint(CreacionUsuarios_bp, url_prefix="/CreacionUsuarios")

    from app.PlanificacionVSEjecucionLabores import bp as PlanificacionVSEjecucionLabores_bp

    app.register_blueprint(PlanificacionVSEjecucionLabores_bp, url_prefix="/PlanificacionVSEjecucionLabores")

    from app.AccesoACompañiasYModulos import bp as AccesoACompañiasYModulos_bp

    app.register_blueprint(AccesoACompañiasYModulos_bp, url_prefix="/AccesoACompaniasYModulos")

    from app.AccesoAOpcionesPorModulos import bp as AccesoAOpcionesPorModulos_bp

    app.register_blueprint(AccesoAOpcionesPorModulos_bp, url_prefix="/AccesoAOpcionesPorModulos")

    from app.ActualizaClaveFechaCaducidadLote import bp as ActualizaClaveFechaCaducidadLote_bp

    app.register_blueprint(ActualizaClaveFechaCaducidadLote_bp, url_prefix="/ActualizaClaveFechaCaducidadLote")

    from app.BancoDeTareas import bp as BancoDeTareas_bp

    app.register_blueprint(BancoDeTareas_bp, url_prefix="/BancoDeTareas")

    from app.ProcesosDeTarea import bp as ProcesosDeTarea_bp

    app.register_blueprint(ProcesosDeTarea_bp, url_prefix="/ProcesosDeTarea")

    from app.PaquetesDeProcesosTareas import bp as PaquetesDeProcesosTareas_bp

    app.register_blueprint(PaquetesDeProcesosTareas_bp, url_prefix="/PaquetesDeProcesosTareas")

    from app.PlanificacionTareas import bp as PlanificacionTareas_bp

    app.register_blueprint(PlanificacionTareas_bp, url_prefix="/PlanificacionTareas")

    from app.AsignacionHorariosAUsuarios import bp as AsignacionHorariosAUsuarios_bp

    app.register_blueprint(AsignacionHorariosAUsuarios_bp, url_prefix="/AsignacionHorariosAUsuarios")

    from app.CreacionCliente import bp as CreacionCliente_bp

    app.register_blueprint(CreacionCliente_bp, url_prefix="/CreacionCliente")

    from app.EjecucionTareas import bp as EjecucionTareas_bp

    app.register_blueprint(EjecucionTareas_bp, url_prefix="/EjecucionTareas")

    from app.ConsultaDeCedulaEventos import bp as ConsultaDeCedulaEventos_bp

    app.register_blueprint(ConsultaDeCedulaEventos_bp, url_prefix="/ConsultaDeCedulaEventos")

    from app.DocumentosAsociadosComponent import bp as DocumentosAsociadosComponent_bp

    app.register_blueprint(DocumentosAsociadosComponent_bp, url_prefix="/DocumentosAsociadosComponent")

    from app.AccesoALocalidades import bp as AccesoALocalidades_bp

    app.register_blueprint(AccesoALocalidades_bp, url_prefix="/AccesoALocalidades")

    from app.CustomModalCreateCliente import bp as CustomModalCreateCliente_bp

    app.register_blueprint(CustomModalCreateCliente_bp, url_prefix="/CustomModalCreateCliente")

    from app.BeneficiariosGravamen import bp as BeneficiariosGravamen_bp

    app.register_blueprint(BeneficiariosGravamen_bp, url_prefix="/BeneficiariosGravamen")

    from app.Cargos import bp as cargos_bp

    app.register_blueprint(cargos_bp, url_prefix="/api/cargos")

    from app.CargaDeTrabajo import bp as CargaDeTrabajo_bp

    app.register_blueprint(CargaDeTrabajo_bp, url_prefix="/CargaDeTrabajo")

    from app.ImpuestosRetenciones import bp as ImpuestosRetenciones_bp

    app.register_blueprint(ImpuestosRetenciones_bp, url_prefix="/ImpuestosRetenciones")

    from app.Integradora import bp as Integradora_bp

    app.register_blueprint(Integradora_bp, url_prefix="/Integradora")

    from app.Iva import bp as Iva_bp

    app.register_blueprint(Iva_bp, url_prefix="/Iva")

    from app.Localidad import bp as Localidad_bp

    app.register_blueprint(Localidad_bp, url_prefix="/Localidad")

    from app.Pais import bp as Pais_bp

    app.register_blueprint(Pais_bp, url_prefix="/Pais")

    from app.Parroquia import bp as Parroquia_bp

    app.register_blueprint(Parroquia_bp, url_prefix="/Parroquia")

    from app.PlanesServicios import bp as PlanesServicios_bp

    app.register_blueprint(PlanesServicios_bp, url_prefix="/PlanesServicios")

    from app.Provincia import bp as Provincia_bp

    app.register_blueprint(Provincia_bp, url_prefix="/Provincia")

    from app.SectorComercialCliente import bp as SectorComercialCliente_bp

    app.register_blueprint(SectorComercialCliente_bp, url_prefix="/SectorComercialCliente")

    from app.TipoDocumento import bp as TipoDocumento_bp

    app.register_blueprint(TipoDocumento_bp, url_prefix="/TipoDocumento")

    from app.TiposCliente import bp as TiposCliente_bp

    app.register_blueprint(TiposCliente_bp, url_prefix="/TiposCliente")

    from app.Ciudad import bp as Ciudad_bp

    app.register_blueprint(Ciudad_bp, url_prefix="/Ciudad")

    from app.TipodeContraCli import bp as tipocontracli_bp

    app.register_blueprint(tipocontracli_bp, url_prefix="/tipocontracli")

    from app.ConsultaDeRuc import bp as ConsultaDeRuc_bp

    app.register_blueprint(ConsultaDeRuc_bp, url_prefix="/ConsultaDeRuc")

    from app.SectorialesIess import bp as SectorialesIess_bp

    app.register_blueprint(SectorialesIess_bp, url_prefix="/SectorialesIess")

    from app.LineasINV import bp as LineasINV_bp

    app.register_blueprint(LineasINV_bp, url_prefix="/LineasINV")

    from app.MarcasINV import bp as MarcasINV_bp

    app.register_blueprint(MarcasINV_bp, url_prefix="/MarcasINV")

    from app.MedidasINV import bp as MedidasINV_bp

    app.register_blueprint(MedidasINV_bp, url_prefix="/MedidasINV")

    from app.PresentacionesINV import bp as PresentacionesINV_bp

    app.register_blueprint(PresentacionesINV_bp, url_prefix="/PresentacionesINV")

    from app.CreacionClienteDF import bp as CreacionClienteDF_bp

    app.register_blueprint(CreacionClienteDF_bp, url_prefix="/CreacionClienteDF")

    from app.TransportistasDF import bp as TransportistasDF_bp

    app.register_blueprint(TransportistasDF_bp, url_prefix="/TransportistasDF")

    from app.VendedoresDF import bp as VendedoresDF_bp

    app.register_blueprint(VendedoresDF_bp, url_prefix="/VendedoresDF")

    from app.ProveedoresDF import bp as ProveedoresDF_bp

    app.register_blueprint(ProveedoresDF_bp, url_prefix="/ProveedoresDF")

    from app.FirmarPDFDF import bp as FirmarPDFDF_bp

    app.register_blueprint(FirmarPDFDF_bp, url_prefix="/FirmarPDFDF")

    from app.PerfilUsuarioDF import bp as PerfilUsuarioDF_bp

    app.register_blueprint(PerfilUsuarioDF_bp, url_prefix="/PerfilUsuarioDF")

    from app.ContraCliDF import bp as ContraCliDF_bp

    app.register_blueprint(ContraCliDF_bp, url_prefix="/ContraCliDF")

    from app.AutorizacionesSri import bp as AutorizacionesSri_bp

    app.register_blueprint(AutorizacionesSri_bp, url_prefix="/AutorizacionesSri")

    from app.PuntosEmisionSri import bp as PuntosEmisionSri_bp

    app.register_blueprint(PuntosEmisionSri_bp, url_prefix="/PuntosEmisionSri")

    from app.Compania import bp as Compania_bp

    app.register_blueprint(Compania_bp, url_prefix="/Compania")

    from app.IntegracionFacturacionElectronica import bp as IntegracionFacturacionElectronica_bp

    app.register_blueprint(IntegracionFacturacionElectronica_bp, url_prefix="/IntegracionFacturacionElectronica")

    print("---------------ENDPOINTS------------------")
    for rule in app.url_map.iter_rules():
        print(str(rule))

    print("---------------/ENDPOINTS------------------")

    # --------------------------------------

    # Ruta para servir todos los archivos dentro de la carpeta "build" de React
    # Serve React App
    @app.route("/")
    def index():
        endpoints = []
        for rule in app.url_map.iter_rules():
            endpoints.append(str(rule))
        return jsonify(endpoints=endpoints)

    # @app.route('/', defaults={'path': ''})
    @app.route("/<path:path>")
    def serve(path):
        if path != "" and os.path.exists(app.static_folder + "/" + path):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, "index.html")

    # --------------------------------------
    # test page
    @app.route("/test/")
    def test_page():
        return "<h1>TEST</h1>"

    return app
