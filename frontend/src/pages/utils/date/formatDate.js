import dayjs from "dayjs"

const formatDateTime = (fechaString, horaString) => {
  try {
    // Remover el " GMT" del string para tratarlo como hora local
    const fechaLocal = fechaString.replace(" GMT", "")
    const horaLocal = horaString.replace(" GMT", "")

    const fecha = dayjs(fechaLocal)
    const hora = dayjs(horaLocal)

    if (!fecha.isValid() || !hora.isValid()) {
      return "No disponible"
    }

    // Combinar fecha y hora
    const fechaHoraCompleta = fecha.hour(hora.hour()).minute(hora.minute()).second(hora.second())

    return fechaHoraCompleta.format("DD/MM/YYYY HH:mm:ss")
  } catch (error) {
    console.error("Error formateando fecha:", error)
    return "No disponible"
  }
}

// Versión simplificada solo para fecha
const formatDate = (fechaString) => {
  try {
    const fechaLocal = fechaString.replace(" GMT", "")
    const fecha = dayjs(fechaLocal)
    return fecha.isValid() ? fecha.format("DD/MM/YYYY") : "No disponible"
  } catch {
    return "No disponible"
  }
}

// Versión simplificada solo para hora
const formatTime = (horaString) => {
  try {
    const horaLocal = horaString.replace(" GMT", "")
    const hora = dayjs(horaLocal)
    return hora.isValid() ? hora.format("HH:mm:ss") : "No disponible"
  } catch {
    return "No disponible"
  }
}

export { formatDateTime, formatDate, formatTime }
