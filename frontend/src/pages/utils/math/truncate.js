function truncateNumber(numero, cantidadDecimales = 2) {
  const factor = 10 ** cantidadDecimales
  const valorTruncado = Math.floor(numero * factor) / factor
  const decimals = Math.floor(valorTruncado * factor) % factor
  const displayValue = `${Math.floor(valorTruncado)}.${decimals.toString().padStart(cantidadDecimales, "0")}`
  return displayValue
}

export default truncateNumber
