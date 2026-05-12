/* eslint-disable import/no-duplicates */
/* eslint-disable no-unused-vars */
import React from "react"

// Protected routes
import { SubMenu } from "../pages"
import { SimpleMenu } from "../pages"

import { Login, LoginInner } from "../pages"
import { ProtectedRoutes } from "../pages"

// Acceso a Compañias y Modulos
import { AccesoACompañiasYModulos, BuscarAccesoACompañiasYModulos } from "../pages"

// Acceso A Opciones Por Modulos
import { AccesoAOpcionesPorModulos, BuscarAccesoAOpcionesPorModulos } from "../pages"

// Actualiza Clave Olvidada
import { ActualizaClaveOlvidada } from "../pages"

// Actualiza Clave Fecha Caducidad Por Lote
import { ActualizaClaveFechaCaducidadLote } from "../pages"

// Banco de Tareas
import { BancoDeTareas, CrearBancoDeTareas, EditarBancoDeTareas } from "../pages"

// Procesos de Tarea
import { ProcesosTarea, CrearProcesosTarea, EditarProcesosTarea } from "../pages"

// Paquetes de Procesos de Tarea
import { PaquetesDeProcesoTareas, CrearPaquetesDeProcesoTareas, EditarPaquetesDeProcesoTareas } from "../pages"

// Planificacion de Tareas
import { PlanificacionDeTareas } from "../pages"

// Asignacion de Horarios a Usuarios
import {
  AsignacionHorariosAUsuarios,
  BuscarAsignacionHorariosAUsuarios,
  CrearAsignacionHorariosAUsuarios,
} from "../pages"

// Creacion de Clientes
import { CreacionClientes, CrearCreacionClientes, EditarCreacionClientes, BuscarCreacionClientes } from "../pages"

// Ejecucion de tareas
import { EjecucionTareas, CrearEjecucionTareas, BuscarEjecucionTareas } from "../pages"

// ConsultaDeCedulaEventos
import { ConsultaDeCedulaEventos } from "../pages"

// Acceso a localidades
import { AccesoALocalidades, AccesoALocalidadesBuscar } from "../pages"

// Parametros Generales - Catalogos
import { Cargos, CrearCargo, EditarCargo } from "../pages"

import { TipodeContraCli, CrearTipodeContraCli, EditarTipodeContraCli } from "../pages"

// Cambio de Clave
import { CambioClave } from "../pages"

// Facturación
import {
  FacturaDesdeArticulos,
  BuscarFacturaDesdeArticulos,
  CrearFacturaDesdeArticulos,
  EditarFacturaDesdeArticulos,
} from "../pages"

// Creacion de usuarios
import { CreacionUsuarios, CrearCreacionUsuarios, BuscarCreacionUsuarios, EditarCreacionUsuarios } from "../pages"

// Beneficiarios de Gravamen
import { BeneficiariosGravamen, CrearBeneficiariosGravamen, EditarBeneficiariosGravamen } from "../pages"

// Carga de Trabajo
import { CargaDeTrabajo } from "../pages"

// Compania
import { Compania, CrearCompania, EditarCompania, BuscarCompania } from "../pages"

// Localidad
import { Localidad, CrearLocalidad, EditarLocalidad, BuscarLocalidad } from "../pages"

// TiposCliente
import { TiposCliente, CrearTiposCliente, EditarTiposCliente } from "../pages"

// TipoDocumento
import { TipoDocumento, CrearTipoDocumento, EditarTipoDocumento } from "../pages"

// Pais
import { Pais, CrearPais, EditarPais } from "../pages"

// Ciudad
import { Ciudad, CrearCiudad, EditarCiudad } from "../pages"

// Provincia
import { Provincia, CrearProvincia, EditarProvincia } from "../pages"

// Parroquia
import { Parroquia, CrearParroquia, EditarParroquia } from "../pages"

// Sector Comercial Cliente
import { SectorComercialCliente, CrearSectorComercialCliente, EditarSectorComercialCliente } from "../pages"

// Integradores Ventas
import { IntegradoresVentas, CrearIntegradoresVentas, EditarIntegradoresVentas } from "../pages"

// Planes Servicios
import { PlanesServicios, CrearPlanServicio, EditarPlanServicio } from "../pages"

// IVA
import { Iva, CrearIva, EditarIva } from "../pages"

// Impuestos y Retenciones
import { ImpuestosRetenciones, CrearImpuestoRetencion, EditarImpuestoRetencion } from "../pages"

// Resumen Productividad
import { ResumenProductividad } from "../pages"

// ConsultaDeRuc
import { ConsultaDeRuc } from "../pages"

//SectorialesIess
import { SectorialesIess, CrearSectorialesIess, EditarSectorialesIess } from "../pages"

//LineasINV
import { LineasINV, CrearLineasINV, EditarLineasINV } from "../pages"

//MarcasINV
import { MarcasINV, CrearMarcasINV, EditarMarcasINV } from "../pages"

//MedidasINV
import { MedidasINV, CrearMedidasINV, EditarMedidasINV } from "../pages"

//PresentacionesINV
import { PresentacionesINV, CrearPresentacionesINV, EditarPresentacionesINV } from "../pages"

//CreacionClienteDF
import { CreacionClienteDF, CrearCreacionClienteDF, EditarCreacionClienteDF } from "../pages"

//TransportistasDF
import { TransportistasDF, CrearTransportistasDF, EditarTransportistasDF } from "../pages"

//VendedoresDF
import { VendedoresDF, CrearVendedoresDF, EditarVendedoresDF } from "../pages"

//ProveedoresDF
import { ProveedoresDF, CrearProveedoresDF, EditarProveedoresDF } from "../pages"

//FirmarPDFDF
import { FirmarPDFDF } from "../pages"

//PerfilUsuarioDF
import { PerfilUsuarioDF } from "../pages"

const protectedRoutes = [
  { path: "Submenu/:label/:id", element: <SubMenu /> },
  { path: "dashboard/AccesoACompañiasYModulos", element: <AccesoACompañiasYModulos /> },
  { path: "dashboard/AccesoACompañiasYModulos/buscar", element: <BuscarAccesoACompañiasYModulos /> },
  { path: "dashboard/AccesoAOpcionesPorModulos", element: <AccesoAOpcionesPorModulos /> },
  { path: "dashboard/AccesoAOpcionesPorModulos/buscar", element: <BuscarAccesoAOpcionesPorModulos /> },
  { path: "dashboard/ActualizaClaveOlvidada", element: <ActualizaClaveOlvidada /> },
  { path: "dashboard/ActualizaClaveFechaCaducidadLote", element: <ActualizaClaveFechaCaducidadLote /> },
  { path: "dashboard/BancoDeTareas", element: <BancoDeTareas /> },
  { path: "dashboard/BancoDeTareas/crear", element: <CrearBancoDeTareas /> },
  { path: "dashboard/BancoDeTareas/editar/:id", element: <EditarBancoDeTareas /> },
  { path: "dashboard/ProcesosTarea", element: <ProcesosTarea /> },
  { path: "dashboard/ProcesosTarea/crear", element: <CrearProcesosTarea /> },
  { path: "dashboard/ProcesosTarea/editar/:proceso", element: <EditarProcesosTarea /> },
  { path: "dashboard/PaquetesDeProcesoTareas", element: <PaquetesDeProcesoTareas /> },
  { path: "dashboard/PaquetesDeProcesoTareas/crear", element: <CrearPaquetesDeProcesoTareas /> },
  { path: "dashboard/PaquetesDeProcesoTareas/editar/:formularioID", element: <EditarPaquetesDeProcesoTareas /> },
  { path: "dashboard/PlanificacionTareas", element: <PlanificacionDeTareas /> },
  { path: "dashboard/AsignacionHorariosAUsuarios", element: <AsignacionHorariosAUsuarios /> },
  { path: "dashboard/AsignacionHorariosAUsuarios/buscar", element: <BuscarAsignacionHorariosAUsuarios /> },
  { path: "dashboard/AsignacionHorariosAUsuarios/crear", element: <CrearAsignacionHorariosAUsuarios /> },
  { path: "dashboard/CreacionClientes", element: <CreacionClientes /> },
  { path: "dashboard/CreacionClientes/crear", element: <CrearCreacionClientes /> },
  { path: "dashboard/CreacionClientes/buscar", element: <BuscarCreacionClientes /> },
  { path: "dashboard/CreacionClientes/editar", element: <EditarCreacionClientes /> },
  { path: "dashboard/EjecucionTareas", element: <EjecucionTareas /> },
  { path: "dashboard/EjecucionTareas/crear", element: <CrearEjecucionTareas /> },
  { path: "dashboard/EjecucionTareas/buscar", element: <BuscarEjecucionTareas /> },
  { path: "dashboard/ConsultaDeCedulaEventos", element: <ConsultaDeCedulaEventos /> },
  { path: "dashboard/AccesoALocalidades", element: <AccesoALocalidades /> },
  { path: "dashboard/AccesoALocalidades/buscar", element: <AccesoALocalidadesBuscar /> },
  { path: "dashboard/Cargos", element: <Cargos /> },
  { path: "dashboard/Cargos/crear", element: <CrearCargo /> },
  { path: "dashboard/Cargos/editar", element: <EditarCargo /> },
  { path: "dashboard/TipodeContraCli", element: <TipodeContraCli /> },
  { path: "dashboard/TipodeContraCli/crear", element: <CrearTipodeContraCli /> },
  { path: "dashboard/TipodeContraCli/editar", element: <EditarTipodeContraCli /> },
  { path: "dashboard/CambioClave", element: <CambioClave /> },
  { path: "dashboard/FacturaDesdeArticulos", element: <FacturaDesdeArticulos /> },
  { path: "dashboard/FacturaDesdeArticulos/buscar", element: <BuscarFacturaDesdeArticulos /> },
  { path: "dashboard/FacturaDesdeArticulos/crear", element: <CrearFacturaDesdeArticulos /> },
  { path: "dashboard/FacturaDesdeArticulos/editar", element: <EditarFacturaDesdeArticulos /> },
  { path: "dashboard/CreacionUsuarios", element: <CreacionUsuarios /> },
  { path: "dashboard/CreacionUsuarios/crear", element: <CrearCreacionUsuarios /> },
  { path: "dashboard/CreacionUsuarios/buscar", element: <BuscarCreacionUsuarios /> },
  { path: "dashboard/CreacionUsuarios/editar", element: <EditarCreacionUsuarios /> },
  { path: "dashboard/BeneficiariosDeGravamenes", element: <BeneficiariosGravamen /> },
  { path: "dashboard/BeneficiariosDeGravamenes/crear", element: <CrearBeneficiariosGravamen /> },
  { path: "dashboard/BeneficiariosDeGravamenes/editar", element: <EditarBeneficiariosGravamen /> },
  { path: "dashboard/CargaDeTrabajo", element: <CargaDeTrabajo /> },
  { path: "dashboard/Compania", element: <Compania /> },
  { path: "dashboard/Compania/crear", element: <CrearCompania /> },
  { path: "dashboard/Compania/editar", element: <EditarCompania /> },
  { path: "dashboard/Compania/buscar", element: <BuscarCompania /> },
  { path: "dashboard/Localidad", element: <Localidad /> },
  { path: "dashboard/Localidad/crear", element: <CrearLocalidad /> },
  { path: "dashboard/Localidad/editar", element: <EditarLocalidad /> },
  { path: "dashboard/Localidad/buscar", element: <BuscarLocalidad /> },
  { path: "dashboard/TiposDeCliente", element: <TiposCliente /> },
  { path: "dashboard/TiposDeCliente/crear", element: <CrearTiposCliente /> },
  { path: "dashboard/TiposDeCliente/editar", element: <EditarTiposCliente /> },
  { path: "dashboard/TipoDeDocumento", element: <TipoDocumento /> },
  { path: "dashboard/TipoDeDocumento/crear", element: <CrearTipoDocumento /> },
  { path: "dashboard/TipoDeDocumento/editar", element: <EditarTipoDocumento /> },
  { path: "dashboard/Pais", element: <Pais /> },
  { path: "dashboard/Pais/crear", element: <CrearPais /> },
  { path: "dashboard/Pais/editar", element: <EditarPais /> },
  { path: "dashboard/Ciudad", element: <Ciudad /> },
  { path: "dashboard/Ciudad/crear", element: <CrearCiudad /> },
  { path: "dashboard/Ciudad/editar", element: <EditarCiudad /> },
  { path: "dashboard/Provincia", element: <Provincia /> },
  { path: "dashboard/Provincia/crear", element: <CrearProvincia /> },
  { path: "dashboard/Provincia/editar", element: <EditarProvincia /> },
  { path: "dashboard/Parroquia", element: <Parroquia /> },
  { path: "dashboard/Parroquia/crear", element: <CrearParroquia /> },
  { path: "dashboard/Parroquia/editar", element: <EditarParroquia /> },
  { path: "dashboard/SectorComercialCliente", element: <SectorComercialCliente /> },
  { path: "dashboard/SectorComercialCliente/crear", element: <CrearSectorComercialCliente /> },
  { path: "dashboard/SectorComercialCliente/editar", element: <EditarSectorComercialCliente /> },
  { path: "dashboard/IntegradoresVentas", element: <IntegradoresVentas /> },
  { path: "dashboard/IntegradoresVentas/crear", element: <CrearIntegradoresVentas /> },
  { path: "dashboard/IntegradoresVentas/editar", element: <EditarIntegradoresVentas /> },
  { path: "dashboard/PlanesServicios", element: <PlanesServicios /> },
  { path: "dashboard/PlanesServicios/crear", element: <CrearPlanServicio /> },
  { path: "dashboard/PlanesServicios/editar", element: <EditarPlanServicio /> },
  { path: "dashboard/IVA", element: <Iva /> },
  { path: "dashboard/IVA/crear", element: <CrearIva /> },
  { path: "dashboard/IVA/editar", element: <EditarIva /> },
  { path: "dashboard/impuestosRetenciones", element: <ImpuestosRetenciones /> },
  { path: "dashboard/impuestosRetenciones/crear", element: <CrearImpuestoRetencion /> },
  { path: "dashboard/impuestosRetenciones/editar", element: <EditarImpuestoRetencion /> },
  { path: "dashboard/ResumenProductividad", element: <ResumenProductividad /> },
  { path: "dashboard/ConsultaDeRuc", element: <ConsultaDeRuc /> },
  { path: "dashboard/SectorialesIess", element: <SectorialesIess /> },
  { path: "dashboard/SectorialesIess/crear", element: <CrearSectorialesIess /> },
  { path: "dashboard/SectorialesIess/editar", element: <EditarSectorialesIess /> },
  { path: "dashboard/LineasINV", element: <LineasINV /> },
  { path: "dashboard/LineasINV/crear", element: <CrearLineasINV /> },
  { path: "dashboard/LineasINV/editar", element: <EditarLineasINV /> },
  { path: "dashboard/MarcasINV", element: <MarcasINV /> },
  { path: "dashboard/MarcasINV/crear", element: <CrearMarcasINV /> },
  { path: "dashboard/MarcasINV/editar", element: <EditarMarcasINV /> }, 
  { path: "dashboard/MedidasINV", element: <MedidasINV /> },
  { path: "dashboard/MedidasINV/crear", element: <CrearMedidasINV /> },
  { path: "dashboard/MedidasINV/editar", element: <EditarMedidasINV /> },  
  { path: "dashboard/PresentacionesINV", element: <PresentacionesINV /> },
  { path: "dashboard/PresentacionesINV/crear", element: <CrearPresentacionesINV /> },
  { path: "dashboard/PresentacionesINV/editar", element: <EditarPresentacionesINV /> },  
  { path: "dashboard/CreacionClienteDF", element: <CreacionClienteDF /> },
  { path: "dashboard/CreacionClienteDF/crear", element: <CrearCreacionClienteDF /> },
  { path: "dashboard/CreacionClienteDF/editar", element: <EditarCreacionClienteDF /> }, 
  { path: "dashboard/TransportistasDF", element: <TransportistasDF /> },
  { path: "dashboard/TransportistasDF/crear", element: <CrearTransportistasDF /> },
  { path: "dashboard/TransportistasDF/editar", element: <EditarTransportistasDF /> }, 
  { path: "dashboard/VendedoresDF", element: <VendedoresDF /> },
  { path: "dashboard/VendedoresDF/crear", element: <CrearVendedoresDF /> },
  { path: "dashboard/VendedoresDF/editar", element: <EditarVendedoresDF /> }, 
  { path: "dashboard/ProveedoresDF", element: <ProveedoresDF /> },
  { path: "dashboard/ProveedoresDF/crear", element: <CrearProveedoresDF /> },
  { path: "dashboard/ProveedoresDF/editar", element: <EditarProveedoresDF /> }, 
  { path: "dashboard/FirmarPDFDF", element: <FirmarPDFDF /> },
  { path: "dashboard/PerfilUsuarioDF", element: <PerfilUsuarioDF /> },
]

export default protectedRoutes
