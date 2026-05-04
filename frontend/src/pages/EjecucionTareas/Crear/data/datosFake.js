// OBJETO BASE CON TODOS LOS KEYS (TIPO M - MULTIPLE)
const datosEjecucionTipoM = {
  evento: {
    ciacodigo: "01",
    loccodigo: "01",
    eventocodigo: "EVM001",
    pregcodigo: "M001",
    pregdescri: "SELECCIONE LOS DOCUMENTOS REVISADOS",
    usrcodigo: "USR003",
    usrnombre: "CARLOS LÓPEZ",
    eventofecha: "2024-05-22",
    eventohorainicio: "2024-05-22T10:00:00",
    eventohorafin: "2024-05-22T11:30:00",
    eventoduracion: 90,
    clicodigo: "CLI003",
    clinombre: "CORPORACIÓN 123",
    eventostatus: "COMPLETADA",
    porcentajeavance: 100,
    paquetecodigo: "PAQ002",
    formsecuen: 2,
    eventorecuren: "mensual",
    eventorecurennum: 6,
    eventorecurensecuen: 3,
    eventofechabase: "2024-05-22T10:00:00",
  },

  tarea: {
    pregtipo: "M",
    pregobligatoria: true,
    insticodigo: null,
    instidescri: null,
    esPresencial: false,
  },

  opcionesTarea: [
    {
      pregsecuen: 1,
      pregdescri: "CONTRATO",
      pregRespuesta: "0",
      pregstatus: "A",
    },
    {
      pregsecuen: 2,
      pregdescri: "FACTURAS",
      pregRespuesta: "0",
      pregstatus: "A",
    },
    {
      pregsecuen: 3,
      pregdescri: "RUT",
      pregRespuesta: "0",
      pregstatus: "A",
    },
    {
      pregsecuen: 4,
      pregdescri: "BALANCE",
      pregRespuesta: "0",
      pregstatus: "I", // Inactiva - no se muestra
    },
  ],

  historialEjecuciones: [
    {
      eventosecuen: 1,
      comentario: "Revisión inicial de documentos",
      statusAnterior: "PENDIENTE",
      statusNuevo: "EN_PROCESO",
      porcentajeavance: 60,
      respuestaTextoLibre: null,
      respuestaListaSecuencia: null,
      respuestaMultipleSecuencias: [1, 2],
      tranusuisys: "USR003",
      tranfecisys: "2024-05-22T10:10:00",
      tranhorcisys: "1900-01-01T10:10:00",
    },
    {
      eventosecuen: 2,
      comentario: "Completada revisión de todos los documentos",
      statusAnterior: "EN_PROCESO",
      statusNuevo: "COMPLETADA",
      porcentajeavance: 100,
      respuestaTextoLibre: null,
      respuestaListaSecuencia: null,
      respuestaMultipleSecuencias: [1, 2, 3],
      tranusuisys: "USR003",
      tranfecisys: "2024-05-22T11:20:00",
      tranhorcisys: "1900-01-01T11:20:00",
    },
  ],

  respuestaTextoLibre: null,
  respuestaListaSecuencia: null,
  respuestaMultipleSecuencias: [1, 2, 3],
}

// TIPO T - TEXTO LIBRE
const datosEjecucionTipoT = {
  evento: {
    ciacodigo: "01",
    loccodigo: "01",
    eventocodigo: "EVT001",
    pregcodigo: "T001",
    pregdescri: "DESCRIBA EL PROBLEMA ENCONTRADO EN LA AUDITORÍA",
    usrcodigo: "USR001",
    usrnombre: "JUAN PÉREZ",
    eventofecha: "2024-05-20",
    eventohorainicio: "2024-05-20T09:00:00",
    eventohorafin: "2024-05-20T10:00:00",
    eventoduracion: 60,
    clicodigo: "CLI001",
    clinombre: "CLIENTE ABC S.A.",
    eventostatus: "PENDIENTE",
    porcentajeavance: 0,
    paquetecodigo: "PAQ001",
    formsecuen: 1,
    eventorecuren: null,
    eventorecurennum: 0,
    eventorecurensecuen: null,
    eventofechabase: "2024-05-20T09:00:00",
  },

  tarea: {
    pregtipo: "U",
    pregobligatoria: true,
    insticodigo: "INS001",
    instidescri: "BANCO NACIONAL",
    esPresencial: false,
  },

  opcionesTarea: [],

  historialEjecuciones: [],

  respuestaTextoLibre: "",
  respuestaListaSecuencia: null,
  respuestaMultipleSecuencias: null,
}

// TIPO L - LISTA DE OPCIONES
const datosEjecucionTipoL = {
  evento: {
    ciacodigo: "01",
    loccodigo: "01",
    eventocodigo: "EVL001",
    pregcodigo: "L001",
    pregdescri: "SELECCIONE EL NIVEL DE PRIORIDAD",
    usrcodigo: "USR002",
    usrnombre: "MARÍA GÓMEZ",
    eventofecha: "2024-05-21",
    eventohorainicio: "2024-05-21T14:00:00",
    eventohorafin: "2024-05-21T14:30:00",
    eventoduracion: 30,
    clicodigo: "CLI002",
    clinombre: "EMPRESA XYZ",
    eventostatus: "EN_PROCESO",
    porcentajeavance: 50,
    paquetecodigo: null,
    formsecuen: null,
    eventorecuren: "semanal",
    eventorecurennum: 4,
    eventorecurensecuen: 2,
    eventofechabase: "2024-05-14T14:00:00",
  },

  tarea: {
    pregtipo: "L",
    pregobligatoria: true,
    insticodigo: "INS002",
    instidescri: "COLEGIO DE CONTADORES",
    esPresencial: true,
  },

  opcionesTarea: [
    {
      pregsecuen: 1,
      pregdescri: "BAJA",
      pregRespuesta: "1", // Opción correcta
      pregstatus: "A",
    },
    {
      pregsecuen: 2,
      pregdescri: "MEDIA",
      pregRespuesta: "0",
      pregstatus: "A",
    },
    {
      pregsecuen: 3,
      pregdescri: "ALTA",
      pregRespuesta: "0",
      pregstatus: "A",
    },
    {
      pregsecuen: 4,
      pregdescri: "URGENTE",
      pregRespuesta: "0",
      pregstatus: "I", // Inactiva
    },
  ],

  historialEjecuciones: [
    {
      eventosecuen: 1,
      comentario: "Iniciando evaluación de prioridad del cliente",
      statusAnterior: "PENDIENTE",
      statusNuevo: "EN_PROCESO",
      porcentajeavance: 50,
      respuestaTextoLibre: null,
      respuestaListaSecuencia: 2,
      respuestaMultipleSecuencias: null,
      tranusuisys: "USR002",
      tranfecisys: "2024-05-21T14:05:00",
      tranhorcisys: "1900-01-01T14:05:00",
    },
  ],

  respuestaTextoLibre: null,
  respuestaListaSecuencia: 2,
  respuestaMultipleSecuencias: null,
}

// TIPO M SIN HISTORIAL (PRIMERA EJECUCIÓN)
const datosEjecucionTipoMPrimeraVez = {
  evento: {
    ciacodigo: "01",
    loccodigo: "01",
    eventocodigo: "EVM002",
    pregcodigo: "M002",
    pregdescri: "SELECCIONE LOS PROCESOS VERIFICADOS",
    usrcodigo: "USR004",
    usrnombre: "ANA RODRÍGUEZ",
    eventofecha: "2024-05-23",
    eventohorainicio: "2024-05-23T08:00:00",
    eventohorafin: "2024-05-23T09:30:00",
    eventoduracion: 90,
    clicodigo: "CLI004",
    clinombre: "EMPRESA DELTA",
    eventostatus: "PENDIENTE",
    porcentajeavance: 0,
    paquetecodigo: null,
    formsecuen: null,
    eventorecuren: null,
    eventorecurennum: 0,
    eventorecurensecuen: null,
    eventofechabase: "2024-05-23T08:00:00",
  },

  tarea: {
    pregtipo: "M",
    pregobligatoria: true,
    insticodigo: "INS003",
    instidescri: "MINISTERIO DE TRABAJO",
    esPresencial: true,
  },

  opcionesTarea: [
    {
      pregsecuen: 1,
      pregdescri: "VERIFICAR DOCUMENTACIÓN",
      pregRespuesta: "0",
      pregstatus: "A",
    },
    {
      pregsecuen: 2,
      pregdescri: "REVISAR FIRMAS",
      pregRespuesta: "0",
      pregstatus: "A",
    },
    {
      pregsecuen: 3,
      pregdescri: "VALIDAR CÁLCULOS",
      pregRespuesta: "0",
      pregstatus: "A",
    },
  ],

  historialEjecuciones: [],

  respuestaTextoLibre: null,
  respuestaListaSecuencia: null,
  respuestaMultipleSecuencias: null,
}

// EVENTO CANCELADO (NO EDITABLE)
const datosEjecucionCancelado = {
  evento: {
    ciacodigo: "01",
    loccodigo: "01",
    eventocodigo: "EVC001",
    pregcodigo: "T002",
    pregdescri: "REVISIÓN CANCELADA",
    usrcodigo: "USR005",
    usrnombre: "PEDRO SÁNCHEZ",
    eventofecha: "2024-05-24",
    eventohorainicio: "2024-05-24T11:00:00",
    eventohorafin: "2024-05-24T12:00:00",
    eventoduracion: 60,
    clicodigo: "CLI005",
    clinombre: "EMPRESA CANCELADA S.A.",
    eventostatus: "CANCELADA",
    porcentajeavance: 0,
    paquetecodigo: null,
    formsecuen: null,
    eventorecuren: null,
    eventorecurennum: 0,
    eventorecurensecuen: null,
    eventofechabase: "2024-05-24T11:00:00",
  },

  tarea: {
    pregtipo: "U",
    pregobligatoria: false,
    insticodigo: null,
    instidescri: null,
    esPresencial: false,
  },

  opcionesTarea: [],

  historialEjecuciones: [
    {
      eventosecuen: 1,
      comentario: "Tarea cancelada por solicitud del cliente",
      statusAnterior: "PENDIENTE",
      statusNuevo: "CANCELADA",
      porcentajeavance: 0,
      respuestaTextoLibre: null,
      respuestaListaSecuencia: null,
      respuestaMultipleSecuencias: null,
      tranusuisys: "SUP001",
      tranfecisys: "2024-05-23T16:30:00",
      tranhorcisys: "1900-01-01T16:30:00",
    },
  ],

  respuestaTextoLibre: null,
  respuestaListaSecuencia: null,
  respuestaMultipleSecuencias: null,
}

// OBJETO PARA PRUEBAS RÁPIDAS
const datosEjecucionPorTipo = {
  T: datosEjecucionTipoT,
  L: datosEjecucionTipoL,
  M: datosEjecucionTipoM,
  M_PRIMERA_VEZ: datosEjecucionTipoMPrimeraVez,
  CANCELADO: datosEjecucionCancelado,
}

export default datosEjecucionPorTipo

// USO EN COMPONENTE:
// const tipo = datos.evento.pregtipo; // 'T', 'L', 'M'
// const datosEjemplo = datosEjecucionPorTipo[tipo];
