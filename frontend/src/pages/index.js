import Login from "./login/Login"
import LoginInner from "./loginInner/LoginInner"
import SubMenu from "./Submenu/Submenu"
import SimpleMenu from "./Submenu/Submenuu"
import ProtectedRoutes from "./ProtectedRoutes/ProtectedRoutes"

// Acceso a Compañias y Modulos
import AccesoACompañiasYModulos from "./AccesoACompañiasYModulos"
import BuscarAccesoACompañiasYModulos from "./AccesoACompañiasYModulos/Buscar"

// Acceso A Opciones Por Modulos
import AccesoAOpcionesPorModulos from "./AccesoAOpcionesPorModulos"
import BuscarAccesoAOpcionesPorModulos from "./AccesoAOpcionesPorModulos/Buscar"

// Actualiza Clave Olvidada
import ActualizaClaveOlvidada from "./ActualizaClaveOlvidada"

// Actualiza Clave Fecha Caducidad Por Lote
import ActualizaClaveFechaCaducidadLote from "./ActualizaClaveFechaCaducidadLote"

// Banco de Tareas
import BancoDeTareas from "./BancoDeTareas"
import CrearBancoDeTareas from "./BancoDeTareas/crear"
import EditarBancoDeTareas from "./BancoDeTareas/editar"

// Procesos de Tarea
import ProcesosTarea from "./ProcesosTarea"
import CrearProcesosTarea from "./ProcesosTarea/crear"
import EditarProcesosTarea from "./ProcesosTarea/editar"

// Paquetes de Proceso de Tareas
import PaquetesDeProcesoTareas from "./PaquetesDeProcesoTareas"
import CrearPaquetesDeProcesoTareas from "./PaquetesDeProcesoTareas/crear"
import EditarPaquetesDeProcesoTareas from "./PaquetesDeProcesoTareas/editar"

// Planificacion de tareas
import PlanificacionDeTareas from "./PlanificacionDeTareas"

// Asignacion de Horarios a Usuarios
import AsignacionHorariosAUsuarios from "./AsignacionHorariosAUsuarios"
import BuscarAsignacionHorariosAUsuarios from "./AsignacionHorariosAUsuarios/Buscar"
import CrearAsignacionHorariosAUsuarios from "./AsignacionHorariosAUsuarios/Crear"

// Creacion de Clientes
import CreacionClientes from "./CreacionClientes"
import CrearCreacionClientes from "./CreacionClientes/Crear"
import EditarCreacionClientes from "./CreacionClientes/Editar"
import BuscarCreacionClientes from "./CreacionClientes/Buscar"

// Ejecucion de tareas
import EjecucionTareas from "./EjecucionTareas"
import CrearEjecucionTareas from "./EjecucionTareas/Crear"
import BuscarEjecucionTareas from "./EjecucionTareas/Buscar"

// ConsultaDeCedulaEventos
import ConsultaDeCedulaEventos from "./ConsultaDeCedulaEventos"

// Acceso a localidades
import AccesoALocalidades from "./AccesoALocalidades"
import AccesoALocalidadesBuscar from "./AccesoALocalidades/buscar"

// Parametros Generales - Catalogos
import Cargos from "./Cargos"
import CrearCargo from "./Cargos/Crear"
import EditarCargo from "./Cargos/Editar"

import TipodeContraCli from "./TipodeContraCli"
import CrearTipodeContraCli from "./TipodeContraCli/Crear"
import EditarTipodeContraCli from "./TipodeContraCli/Editar"

// Cambio de Clave
import CambioClave from "./CambioClave"

// Facturación
import FacturaDesdeArticulos from "./FacturaDesdeArticulos"
import BuscarFacturaDesdeArticulos from "./FacturaDesdeArticulos/Buscar"
import CrearFacturaDesdeArticulos from "./FacturaDesdeArticulos/Crear"
import EditarFacturaDesdeArticulos from "./FacturaDesdeArticulos/Editar"

// FacturaDesdeArticulosDF
import FacturaDesdeArticulosDF from "./FacturaDesdeArticulosDF"
import BuscarFacturaDesdeArticulosDF from "./FacturaDesdeArticulosDF/Buscar"
import CrearFacturaDesdeArticulosDF from "./FacturaDesdeArticulosDF/Crear"
import EditarFacturaDesdeArticulosDF from "./FacturaDesdeArticulosDF/Editar"

// Creacion de usuarios
import CreacionUsuarios from "./CreacionUsuarios"
import CrearCreacionUsuarios from "./CreacionUsuarios/Crear"
import BuscarCreacionUsuarios from "./CreacionUsuarios/Buscar"
import EditarCreacionUsuarios from "./CreacionUsuarios/Editar"

// Beneficiarios de Gravamen
import BeneficiariosGravamen from "./BeneficiariosGravamen"
import CrearBeneficiariosGravamen from "./BeneficiariosGravamen/Crear"
import EditarBeneficiariosGravamen from "./BeneficiariosGravamen/Editar"

// Tipos de Certificado
// (Eliminado: TiposCertificado, CrearTipoCertificado, EditarTipoCertificado - No están en la lista)

// Carga de Trabajo
import CargaDeTrabajo from "./CargaDeTrabajo"

// Compania
import Compania from "./Compania/CompaniaMainPage"
import CrearCompania from "./Compania/Crear/CrearCompaniaPage"
import EditarCompania from "./Compania/Editar/EditarCompaniaPage"
import BuscarCompania from "./Compania/Buscar/BuscarCompaniaPage"

// Localidad
import Localidad from "./Localidad/LocalidadMainPage"
import CrearLocalidad from "./Localidad/Crear/CrearLocalidadPage"
import EditarLocalidad from "./Localidad/Editar/EditarLocalidadPage"
import BuscarLocalidad from "./Localidad/Buscar/BuscarLocalidadPage"

// TipoDocumento
import TipoDocumento from "./TipoDocumento"
import CrearTipoDocumento from "./TipoDocumento/Crear"
import EditarTipoDocumento from "./TipoDocumento/Editar"

// Pais
import Pais from "./Pais"
import CrearPais from "./Pais/Crear"
import EditarPais from "./Pais/Editar"

// Ciudad
import Ciudad from "./Ciudad"
import CrearCiudad from "./Ciudad/Crear"
import EditarCiudad from "./Ciudad/Editar"

// Provincia
import Provincia from "./Provincia"
import CrearProvincia from "./Provincia/Crear"
import EditarProvincia from "./Provincia/Editar"

// Parroquia
import Parroquia from "./Parroquia"
import CrearParroquia from "./Parroquia/Crear"
import EditarParroquia from "./Parroquia/Editar"

// Sector Comercial Cliente
import SectorComercialCliente from "./SectorComercialCliente"
import CrearSectorComercialCliente from "./SectorComercialCliente/Crear"
import EditarSectorComercialCliente from "./SectorComercialCliente/Editar"

// Integradores Ventas
import IntegradoresVentas from "./IntegradoresVentas"
import CrearIntegradoresVentas from "./IntegradoresVentas/Crear"
import EditarIntegradoresVentas from "./IntegradoresVentas/Editar"

// Planes Servicios
import PlanesServicios from "./PlanesServicios"
import CrearPlanServicio from "./PlanesServicios/Crear"
import EditarPlanServicio from "./PlanesServicios/Editar"

// IVA
import Iva from "./Iva"
import CrearIva from "./Iva/Crear"
import EditarIva from "./Iva/Editar"

// Impuestos y Retenciones
import ImpuestosRetenciones from "./ImpuestosRetenciones"
import CrearImpuestoRetencion from "./ImpuestosRetenciones/Crear"
import EditarImpuestoRetencion from "./ImpuestosRetenciones/Editar"

// Resumen Productividad
import ResumenProductividad from "./ResumenProductividad"

// Consulta de Ruc
import ConsultaDeRuc from "./ConsultaDeRuc"

// SectorialesIess
import SectorialesIess from "./SectorialesIess"
import CrearSectorialesIess from "./SectorialesIess/Crear"
import EditarSectorialesIess from "./SectorialesIess/Editar"

// LineasINV
import LineasINV from "./LineasINV"
import CrearLineasINV from "./LineasINV/Crear"
import EditarLineasINV from "./LineasINV/Editar"

// MarcasINV
import MarcasINV from "./MarcasINV"
import CrearMarcasINV from "./MarcasINV/Crear"
import EditarMarcasINV from "./MarcasINV/Editar"

// MedidasINV
import MedidasINV from "./MedidasINV"
import CrearMedidasINV from "./MedidasINV/Crear"
import EditarMedidasINV from "./MedidasINV/Editar"

// PresentacionesINV
import PresentacionesINV from "./PresentacionesINV"
import CrearPresentacionesINV from "./PresentacionesINV/Crear"
import EditarPresentacionesINV from "./PresentacionesINV/Editar"

// TiposCliente
import TiposCliente from "./TiposCliente"
import CrearTiposCliente from "./TiposCliente/Crear"
import EditarTiposCliente from "./TiposCliente/Editar"

// CreacionClienteDF
import CreacionClienteDF from "./CreacionClienteDF"
import CrearCreacionClienteDF from "./CreacionClienteDF/Crear"
import EditarCreacionClienteDF from "./CreacionClienteDF/Editar"

// TransportistasDF
import TransportistasDF from "./TransportistasDF"
import CrearTransportistasDF from "./TransportistasDF/Crear"
import EditarTransportistasDF from "./TransportistasDF/Editar"

// VendedoresDF
import VendedoresDF from "./VendedoresDF"
import CrearVendedoresDF from "./VendedoresDF/Crear"
import EditarVendedoresDF from "./VendedoresDF/Editar"

// ProveedoresDF
import ProveedoresDF from "./ProveedoresDF"
import CrearProveedoresDF from "./ProveedoresDF/Crear"
import EditarProveedoresDF from "./ProveedoresDF/Editar"

// FirmarPDFDF
import FirmarPDFDF from "./FirmarPDFDF"

// PerfilUsuarioDF
import PerfilUsuarioDF from "./PerfilUsuarioDF"

// ContraCliDF
import ContraCliDF from "./ContraCliDF"
import CrearContraCliDF from "./ContraCliDF/Crear"
import EditarContraCliDF from "./ContraCliDF/Editar"

// AutorizacionesSri
import AutorizacionesSri from "./AutorizacionesSri"
import CrearAutorizacionesSri from "./AutorizacionesSri/Crear"
import EditarAutorizacionesSri from "./AutorizacionesSri/Editar"

// PuntosEmisionSri
import PuntosEmisionSri from "./PuntosEmisionSri"
import CrearPuntosEmisionSri from "./PuntosEmisionSri/Crear"
import EditarPuntosEmisionSri from "./PuntosEmisionSri/Editar"

// TipoDeCredenciales
import TipoDeCredenciales from "./TipoDeCredenciales"
import CrearTipoDeCredenciales from "./TipoDeCredenciales/Crear"
import EditarTipoDeCredenciales from "./TipoDeCredenciales/Editar"

// Instituciones
import Instituciones from "./Instituciones"
import CrearInstituciones from "./Instituciones/Crear"
import EditarInstituciones from "./Instituciones/Editar"

// SecuenciasInternas
import SecuenciasInternas from "./SecuenciasInternas"
import CrearSecuenciasInternas from "./SecuenciasInternas/Crear"
import EditarSecuenciasInternas from "./SecuenciasInternas/Editar"

// SecuenciasDoc
import SecuenciasDoc from "./SecuenciasDoc"
import CrearSecuenciasDoc from "./SecuenciasDoc/Crear"
import EditarSecuenciasDoc from "./SecuenciasDoc/Editar"

// NotaCreditoDF
import NotaCreditoDF from "./NotaCreditoDF"
import BuscarNotaCreditoDF from "./NotaCreditoDF/Buscar"
import CrearNotaCreditoDF from "./NotaCreditoDF/Crear"

// NotaDebitoDF
import NotaDebitoDF from "./NotaDebitoDF"
import BuscarNotaDebitoDF from "./NotaDebitoDF/Buscar"
import CrearNotaDebitoDF from "./NotaDebitoDF/Crear"

// GuiadeRemisionDF
import GuiadeRemisionDF from "./GuiadeRemisionDF"
import BuscarGuiadeRemisionDF from "./GuiadeRemisionDF/Buscar"
import CrearGuiadeRemisionDF from "./GuiadeRemisionDF/Crear"

// ServiciosNDNC
import ServiciosNDNC from "./ServiciosNDNC"
import CrearServiciosNDNC from "./ServiciosNDNC/Crear"
import EditarServiciosNDNC from "./ServiciosNDNC/Editar"

// RetencionDF
import RetencionDF from "./RetencionDF"
import BuscarRetencionDF from "./RetencionDF/Buscar"
import CrearRetencionDF from "./RetencionDF/Crear"

// FormasDeCobro
import FormasDeCobro from "./FormasDeCobro"
import CrearFormasDeCobro from "./FormasDeCobro/Crear"
import EditarFormasDeCobro from "./FormasDeCobro/Editar"

// ExcepcionesdeIVA
import ExcepcionesdeIVA from "./ExcepcionesdeIVA"
import CrearExcepcionesdeIVA from "./ExcepcionesdeIVA/Crear"
import EditarExcepcionesdeIVA from "./ExcepcionesdeIVA/Editar"

// TipoDeCompania
import TipoDeCompania from "./TipoDeCompania"
import CrearTipoDeCompania from "./TipoDeCompania/Crear"
import EditarTipoDeCompania from "./TipoDeCompania/Editar"

export {
  Login,
  LoginInner,
  SubMenu,
  SimpleMenu,
  ProtectedRoutes,
  AccesoACompañiasYModulos,
  BuscarAccesoACompañiasYModulos,
  AccesoAOpcionesPorModulos,
  BuscarAccesoAOpcionesPorModulos,
  ActualizaClaveOlvidada,
  ActualizaClaveFechaCaducidadLote,
  BancoDeTareas,
  CrearBancoDeTareas,
  EditarBancoDeTareas,
  ProcesosTarea,
  CrearProcesosTarea,
  EditarProcesosTarea,
  PaquetesDeProcesoTareas,
  CrearPaquetesDeProcesoTareas,
  EditarPaquetesDeProcesoTareas,
  PlanificacionDeTareas,
  AsignacionHorariosAUsuarios,
  BuscarAsignacionHorariosAUsuarios,
  CrearAsignacionHorariosAUsuarios,
  CreacionClientes,
  CrearCreacionClientes,
  EditarCreacionClientes,
  BuscarCreacionClientes,
  EjecucionTareas,
  CrearEjecucionTareas,
  BuscarEjecucionTareas,
  ConsultaDeCedulaEventos,
  AccesoALocalidades,
  AccesoALocalidadesBuscar,
  Cargos,
  CrearCargo,
  EditarCargo,
  TipodeContraCli,
  CrearTipodeContraCli,
  EditarTipodeContraCli,
  CambioClave,
  FacturaDesdeArticulos,
  BuscarFacturaDesdeArticulos,
  CrearFacturaDesdeArticulos,
  EditarFacturaDesdeArticulos,
  FacturaDesdeArticulosDF,
  BuscarFacturaDesdeArticulosDF,
  CrearFacturaDesdeArticulosDF,
  EditarFacturaDesdeArticulosDF,
  CreacionUsuarios,
  CrearCreacionUsuarios,
  BuscarCreacionUsuarios,
  EditarCreacionUsuarios,
  BeneficiariosGravamen,
  CrearBeneficiariosGravamen,
  EditarBeneficiariosGravamen,
  CargaDeTrabajo,
  Compania,
  CrearCompania,
  EditarCompania,
  BuscarCompania,
  Localidad,
  CrearLocalidad,
  EditarLocalidad,
  BuscarLocalidad,
  TiposCliente,
  CrearTiposCliente,
  EditarTiposCliente,
  TipoDocumento,
  CrearTipoDocumento,
  EditarTipoDocumento,
  Pais,
  CrearPais,
  EditarPais,
  Ciudad,
  CrearCiudad,
  EditarCiudad,
  Provincia,
  CrearProvincia,
  EditarProvincia,
  Parroquia,
  CrearParroquia,
  EditarParroquia,
  SectorComercialCliente,
  CrearSectorComercialCliente,
  EditarSectorComercialCliente,
  IntegradoresVentas,
  CrearIntegradoresVentas,
  EditarIntegradoresVentas,
  PlanesServicios,
  CrearPlanServicio,
  EditarPlanServicio,
  Iva,
  CrearIva,
  EditarIva,
  ImpuestosRetenciones,
  CrearImpuestoRetencion,
  EditarImpuestoRetencion,
  ResumenProductividad,
  ConsultaDeRuc,
  SectorialesIess,
  CrearSectorialesIess,
  EditarSectorialesIess,
  LineasINV,
  CrearLineasINV,
  EditarLineasINV,
  MarcasINV,
  CrearMarcasINV,
  EditarMarcasINV,
  MedidasINV,
  CrearMedidasINV,
  EditarMedidasINV,
  PresentacionesINV,
  CrearPresentacionesINV,
  EditarPresentacionesINV,
  CreacionClienteDF,
  CrearCreacionClienteDF,
  EditarCreacionClienteDF,
  TransportistasDF,
  CrearTransportistasDF,
  EditarTransportistasDF,
  VendedoresDF,
  CrearVendedoresDF,
  EditarVendedoresDF,
  ProveedoresDF,
  CrearProveedoresDF,
  EditarProveedoresDF,
  FirmarPDFDF,
  PerfilUsuarioDF,
  ContraCliDF,
  CrearContraCliDF,
  EditarContraCliDF,
  AutorizacionesSri,
  CrearAutorizacionesSri,
  EditarAutorizacionesSri,
  PuntosEmisionSri,
  CrearPuntosEmisionSri,
  EditarPuntosEmisionSri,
  TipoDeCredenciales,
  CrearTipoDeCredenciales,
  EditarTipoDeCredenciales,
  Instituciones,
  CrearInstituciones,
  EditarInstituciones,
  SecuenciasInternas,
  CrearSecuenciasInternas,
  EditarSecuenciasInternas,
  SecuenciasDoc,
  CrearSecuenciasDoc,
  EditarSecuenciasDoc,
  NotaDebitoDF,
  BuscarNotaDebitoDF,
  CrearNotaDebitoDF,
  GuiadeRemisionDF,
  BuscarGuiadeRemisionDF,
  CrearGuiadeRemisionDF,
  ServiciosNDNC,
  CrearServiciosNDNC,
  EditarServiciosNDNC,
  NotaCreditoDF,
  BuscarNotaCreditoDF,
  CrearNotaCreditoDF,
  RetencionDF,
  CrearRetencionDF,
  BuscarRetencionDF,
  FormasDeCobro,
  CrearFormasDeCobro,
  EditarFormasDeCobro,
  ExcepcionesdeIVA,
  CrearExcepcionesdeIVA,
  EditarExcepcionesdeIVA,
  TipoDeCompania,
  CrearTipoDeCompania,
  EditarTipoDeCompania,
}
