import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import "dayjs/locale/es"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isBetween from "dayjs/plugin/isBetween"
import customParseFormat from "dayjs/plugin/customParseFormat"

// Extender dayjs con los plugins necesarios
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)
dayjs.extend(customParseFormat)

// Configuración de Day.js para Ecuador
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale("es")
dayjs.tz.setDefault("America/Guayaquil")

export const formatDateForDisplay = (date) => {
  return dayjs(date).format("DD/MM/YYYY HH:mm")
}

export const formatDateForBackend = (date) => {
  return dayjs(date).tz("America/Guayaquil").toISOString()
}

export const calculateEndTime = (startTime, durationMinutes) => {
  return dayjs(startTime).add(durationMinutes, "minute")
}

export const parseStringToDayjs = (dateString) => {
  return dayjs(dateString).tz("America/Guayaquil")
}

export default dayjs
