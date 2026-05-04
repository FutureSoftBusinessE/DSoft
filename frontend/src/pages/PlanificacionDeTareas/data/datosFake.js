export const usuariosFake = [
  {
    usrcodigo: "USR001",
    usrnombre: "Ana García",
    horarioEntrada: "08:00",
    horarioSalida: "17:00",
  },
  {
    usrcodigo: "USR002",
    usrnombre: "Carlos López",
    horarioEntrada: "09:00",
    horarioSalida: "18:00",
  },
  {
    usrcodigo: "USR003",
    usrnombre: "María Rodríguez",
    horarioEntrada: "08:30",
    horarioSalida: "17:30",
  },
]

export const clientesFake = [
  { clienteId: "CLI001", nombre: "Cliente 1" },
  { clienteId: "CLI002", nombre: "Cliente 2" },
  { clienteId: "CLI003", nombre: "Cliente 3" },
]

export const paquetesFake = [
  {
    formcodigo: "PAA2500000501",
    formdescri: "PLAN SISTEMA CON FIRMA",
    tareas: [
      {
        pregcodigo: "TAA2500000301",
        pregdescri: "Crear usuario del sistema",
        pregdurmin: 5,
        pregrecuren: "",
        pregrecurennum: 0,
        formsecuen: 1,
      },
      {
        pregcodigo: "TAA2500000401",
        pregdescri: "Configurar permisos de acceso",
        pregdurmin: 10,
        pregrecuren: "semanal",
        pregrecurennum: 3,
        formsecuen: 2,
      },
      {
        pregcodigo: "TAA2500000501",
        pregdescri: "Enviar credenciales por correo",
        pregdurmin: 5,
        pregrecuren: "",
        pregrecurennum: 0,
        formsecuen: 3,
      },
    ],
  },
  {
    formcodigo: "PAA2500000601",
    formdescri: "PLAN EMISIÓN CON FIRMA",
    tareas: [
      {
        pregcodigo: "TAA2500001201",
        pregdescri: "Configurar sucursal",
        pregdurmin: 15,
        pregrecuren: "",
        pregrecurennum: 0,
        formsecuen: 1,
      },
      {
        pregcodigo: "TAA2500001301",
        pregdescri: "Generar documento electrónico",
        pregdurmin: 20,
        pregrecuren: "mensual",
        pregrecurennum: 2,
        formsecuen: 2,
      },
    ],
  },
]

// {
//     "cliente": "000001",
//     "clienteNombre": "CLIENTE FINAL",
//     "tareas": [
//         {
//             "horario": {
//                 "hrsecuen": 1,
//                 "dia": 2,
//                 "horaini": "07:00",
//                 "horafin": "17:00",
//                 "cupo": 8
//             },
//             "pregcodigo": "TAA2500002801",
//             "pregdescri": "REGISTRO DE NOTAS DE CREDITO PARA DECLARACION ",
//             "usuario": "USR11CODE",
//             "usuarioNombre": "USR11",
//             "fechaBase": "2025-12-08",
//             "horaInicio": "07:00",
//             "duracion": 10,
//             "recurrencia": "mensual",
//             "repeticiones": 1,
//             "paqueteCodigo": "PAA2500001401",
//             "origen": "automatico",
//             "esEliminable": false,
//             "formsecuen": 1,
//             "pregrecuren": "mensual",
//             "pregrecurennum": 0
//         },
//         {
//             "horario": {
//                 "hrsecuen": 1,
//                 "dia": 2,
//                 "horaini": "07:00",
//                 "horafin": "17:00",
//                 "cupo": 8
//             },
//             "pregcodigo": "TAA2500002701",
//             "pregdescri": "REGISTRO DE RETENCIONES PARA DECLARACION",
//             "usuario": "USR11CODE",
//             "usuarioNombre": "USR11",
//             "fechaBase": "2025-12-08",
//             "horaInicio": "07:10",
//             "duracion": 30,
//             "recurrencia": "mensual",
//             "repeticiones": 1,
//             "paqueteCodigo": "PAA2500001401",
//             "origen": "automatico",
//             "esEliminable": false,
//             "formsecuen": 2,
//             "pregrecuren": "mensual",
//             "pregrecurennum": 0
//         },
//         {
//             "horario": {
//                 "hrsecuen": 1,
//                 "dia": 2,
//                 "horaini": "07:00",
//                 "horafin": "17:00",
//                 "cupo": 8
//             },
//             "pregcodigo": "TAA2500002601",
//             "pregdescri": "REGISTRO DE VENTAS PARA DECLARACIONES",
//             "usuario": "USR11CODE",
//             "usuarioNombre": "USR11",
//             "fechaBase": "2025-12-08",
//             "horaInicio": "07:40",
//             "duracion": 20,
//             "recurrencia": "mensual",
//             "repeticiones": 1,
//             "paqueteCodigo": "PAA2500001401",
//             "origen": "automatico",
//             "esEliminable": false,
//             "formsecuen": 3,
//             "pregrecuren": "mensual",
//             "pregrecurennum": 0
//         },
//         {
//             "horario": {
//                 "hrsecuen": 2,
//                 "dia": 2,
//                 "horaini": "17:00",
//                 "horafin": "20:00",
//                 "cupo": 2
//             },
//             "pregcodigo": "TAA2500002501",
//             "pregdescri": "REGISTRO DE COMPRAS PARA DECLARACION",
//             "usuario": "USR11CODE",
//             "usuarioNombre": "USR11",
//             "fechaBase": "2025-12-08",
//             "horaInicio": "19:00",
//             "duracion": 10,
//             "recurrencia": "mensual",
//             "repeticiones": 1,
//             "paqueteCodigo": "PAA2500001401",
//             "origen": "automatico",
//             "esEliminable": false,
//             "formsecuen": 4,
//             "pregrecuren": "mensual",
//             "pregrecurennum": 0
//         },
//         {
//             "horario": {
//                 "hrsecuen": 1,
//                 "dia": 4,
//                 "horaini": "09:00",
//                 "horafin": "17:00",
//                 "cupo": 10
//             },
//             "pregcodigo": "TAA2500000401",
//             "pregdescri": "envió de correo con credenciales",
//             "usuario": "mespinoza",
//             "usuarioNombre": "Mariano Espinoza",
//             "fechaBase": "2025-12-17",
//             "horaInicio": "09:00",
//             "duracion": 5,
//             "recurrencia": "",
//             "repeticiones": 1,
//             "paqueteCodigo": null,
//             "origen": "manual",
//             "esEliminable": true,
//             "formsecuen": null,
//             "pregrecuren": "",
//             "pregrecurennum": 0
//         }
//     ]
// }

// {
//     "cliente": "000001",
//     "clienteNombre": "CLIENTE FINAL",
//     "tareas": [
//         {
//             "horario": {
//                 "hrsecuen": 1,
//                 "dia": 2,
//                 "horaini": "07:00",
//                 "horafin": "17:00",
//                 "cupo": 8
//             },
//             "pregcodigo": "TAA2500000301",
//             "pregdescri": "crear el usuario del sistema y asignar el perfil",
//             "usuario": "USR11CODE",
//             "usuarioNombre": "USR11",
//             "fechaBase": "2025-12-08",
//             "horaInicio": "07:00",
//             "duracion": 5,
//             "recurrencia": "",
//             "repeticiones": 1,
//             "paqueteCodigo": "PAA2500000401",
//             "origen": "automatico",
//             "esEliminable": false,
//             "formsecuen": 1,
//             "pregrecuren": "",
//             "pregrecurennum": 0
//         },
//         {
//             "horario": {
//                 "hrsecuen": 1,
//                 "dia": 2,
//                 "horaini": "07:00",
//                 "horafin": "17:00",
//                 "cupo": 8
//             },
//             "pregcodigo": "TAA2500000401",
//             "pregdescri": "envió de correo con credenciales",
//             "usuario": "USR11CODE",
//             "usuarioNombre": "USR11",
//             "fechaBase": "2025-12-08",
//             "horaInicio": "07:05",
//             "duracion": 5,
//             "recurrencia": "semanal",
//             "repeticiones": 3,
//             "paqueteCodigo": "PAA2500000401",
//             "origen": "automatico",
//             "esEliminable": false,
//             "formsecuen": 2,
//             "pregrecuren": "",
//             "pregrecurennum": 0
//         },
//         {
//             "horario": {
//                 "hrsecuen": 1,
//                 "dia": 4,
//                 "horaini": "09:00",
//                 "horafin": "17:00",
//                 "cupo": 10
//             },
//             "pregcodigo": "TAA2500000501",
//             "pregdescri": "pago de firma",
//             "usuario": "mespinoza",
//             "usuarioNombre": "Mariano Espinoza",
//             "fechaBase": "2025-12-17",
//             "horaInicio": "09:10",
//             "duracion": 5,
//             "recurrencia": "diaria",
//             "repeticiones": 5,
//             "paqueteCodigo": null,
//             "origen": "manual",
//             "esEliminable": true,
//             "formsecuen": null,
//             "pregrecuren": "",
//             "pregrecurennum": 0
//         }

//         {
//     "horario": {
//         "hrsecuen": 2,
//         "dia": 5,
//         "horaini": "08:00",
//         "horafin": "16:00",
//         "cupo": 2
//     },
//     "pregcodigo": "TAA2500001301",
//     "pregdescri": "Generación de documento electrónico",
//     "usuario": "mespinoza",
//     "usuarioNombre": "Mariano Espinoza",
//     "fechaBase": "2025-12-18",
//     "horaInicio": "08:00",
//     "duracion": 1,
//     "recurrencia": "",
//     "repeticiones": 1,
//     "paqueteCodigo": null,
//     "origen": "manual",
//     "esEliminable": true,
//     "formsecuen": null,
//     "pregrecuren": "",
//     "pregrecurennum": 0
// }

//     ]
// }
