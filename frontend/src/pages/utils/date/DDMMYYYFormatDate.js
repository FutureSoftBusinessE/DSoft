import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

const normalFormatDate = (date) => {
  // Crear un objeto Day.js a partir de la cadena de fecha y hora
  const fecha = dayjs(date).utc()

  // Formatear la fecha y hora según el formato deseado
  const fechaFormateada = fecha.format("DD/MM/YYYY")
  // eslint-disable-next-line no-unused-vars
  const horaFormateada = fecha.format("HH:mm:ss")

  return fechaFormateada
}

export default normalFormatDate
