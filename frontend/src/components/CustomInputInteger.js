import { TextField } from "@mui/material"

const CustomInputInteger = ({ value, setValue, ...params }) => {
  const handleChange = (event) => {
    const newValue = event.target.value.replace(/\D/g, "") // Eliminar todos los caracteres que no sean dígitos
    // Verificar si newValue es una cadena vacía después de eliminar caracteres no numéricos
    if (newValue === "") {
      setValue(0)
    } else {
      // Convertir newValue a un número entero
      const intValue = parseInt(newValue)
      // Desestructurar min y max desde los params (pueden no existir)
      const { min, max } = params.InputProps?.inputProps || {}

      if (!isNaN(intValue)) {
        if (min !== undefined && max !== undefined) {
          // Validar solo si ambos min y max están definidos
          if (intValue >= min && intValue <= max) {
            setValue(intValue)
          }
        } else {
          // Si min y max no existen, solo actualizar el valor sin validación de rango
          setValue(intValue)
        }
      }
    }
  }
  return (
    <TextField
      fullWidth
      variant="standard"
      type="number"
      value={value.toString()}
      onChange={handleChange}
      {...params}
    />
  )
}

// USAGE
//  <IntegerInput
// value={Number(product.cantidadEmbalaje)}
// setValue={(newVal) =>
//     setProducto(product.sgasoling, product.artcodigo, {
//     cantidadEmbalaje: newVal,
//     })
// }
// InputProps={{
//     inputProps: {
//       min={0},
//       max={Number(product.sgacansol)},
//     },
//   }}

// />

export default CustomInputInteger
